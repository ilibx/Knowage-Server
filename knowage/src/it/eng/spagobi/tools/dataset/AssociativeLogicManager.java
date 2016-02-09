/**

SpagoBI - The Business Intelligence Free Platform

Copyright (C) 2005-2010 Engineering Ingegneria Informatica S.p.A.

This library is free software; you can redistribute it and/or
modify it under the terms of the GNU Lesser General Public
License as published by the Free Software Foundation; either
version 2.1 of the License, or (at your option) any later version.

This library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public
License along with this library; if not, write to the Free Software
Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 **/

package it.eng.spagobi.tools.dataset;

import it.eng.spago.error.EMFUserError;
import it.eng.spagobi.commons.dao.DAOFactory;
import it.eng.spagobi.tools.dataset.bo.AbstractJDBCDataset;
import it.eng.spagobi.tools.dataset.cache.ICache;
import it.eng.spagobi.tools.dataset.cache.SpagoBICacheConfiguration;
import it.eng.spagobi.tools.dataset.cache.SpagoBICacheManager;
import it.eng.spagobi.tools.dataset.graph.EdgeGroup;
import it.eng.spagobi.tools.dataset.graph.LabeledEdge;
import it.eng.spagobi.tools.datasource.bo.IDataSource;
import it.eng.spagobi.utilities.cache.CacheItem;
import it.eng.spagobi.utilities.exceptions.SpagoBIException;
import it.eng.spagobi.utilities.exceptions.SpagoBIRuntimeException;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang.StringUtils;
import org.apache.log4j.Logger;
import org.jgrapht.graph.Pseudograph;

/**
 * @author Alessandro Portosa (alessandro.portosa@eng.it)
 *
 */

public class AssociativeLogicManager {

	private final static int IN_CLAUSE_LIMIT = 999;

	private final IDataSource dataSource;
	private final ICache cache;
	private Map<EdgeGroup, Set<String>> edgeGroupValues;
	private final Map<String, Map<String, String>> datasetToAssociations;
	private Map<String, Set<EdgeGroup>> datasetToEdgeGroup;
	private Map<EdgeGroup, Set<String>> edgeGroupToDataset;
	private final Pseudograph<String, LabeledEdge<String>> graph;
	private final Map<String, String> datasetToCachedTable;
	private final Map<String, String> selections;

	static private Logger logger = Logger.getLogger(AssociativeLogicManager.class);

	public AssociativeLogicManager(Pseudograph<String, LabeledEdge<String>> graph, Map<String, Map<String, String>> datasetToAssociations,
			Map<String, String> selections) {
		this.graph = graph;
		this.datasetToAssociations = datasetToAssociations;
		this.selections = selections;

		this.datasetToCachedTable = new HashMap<String, String>();
		this.dataSource = SpagoBICacheConfiguration.getInstance().getCacheDataSource();
		this.cache = SpagoBICacheManager.getCache();
	}

	public Map<EdgeGroup, Set<String>> process() throws Exception {
		if (dataSource == null) {
			throw new SpagoBIException("Unable to get cache datasource, the value of [dataSource] is [null]");
		}
		if (cache == null) {
			throw new SpagoBIException("Unable to get cache, the value of [cache] is [null]");
		}

		// (0) generate the starting set of values for each associations
		init();

		// (1) user click on widget -> selection!
		for (String datasetSelected : selections.keySet()) {
			String filterSelected = selections.get(datasetSelected);
			calculateDatasets(datasetSelected, null, filterSelected);
		}

		return edgeGroupValues;
	}

	private void init() {
		edgeGroupValues = new HashMap<EdgeGroup, Set<String>>();
		datasetToEdgeGroup = new HashMap<String, Set<EdgeGroup>>();
		edgeGroupToDataset = new HashMap<EdgeGroup, Set<String>>();

		try {
			for (String v1 : graph.vertexSet()) {
				datasetToEdgeGroup.put(v1, new HashSet<EdgeGroup>());
				for (String v2 : graph.vertexSet()) {
					if (!v1.equals(v2)) {
						Set<LabeledEdge<String>> edges = graph.getAllEdges(v1, v2);
						if (!edges.isEmpty()) {
							EdgeGroup group = new EdgeGroup(edges);
							datasetToEdgeGroup.get(v1).add(group);

							String tableName = getCachedTableName(v1);

							// PreparedStatement stmt = getPreparedQuery(dataSource.getConnection(), columnNames, cacheItem.getTable());
							String query = "SELECT DISTINCT " + getColumnNames(group.getOrderedEdgeNames(), v1) + " FROM " + tableName;
							Connection connection = null;
							Statement stmt = null;
							ResultSet rs = null;
							Set<String> tuple = null;
							try {
								connection = dataSource.getConnection();
								stmt = connection.createStatement();
								rs = stmt.executeQuery(query);
								tuple = getTupleOfValues(rs);
							} finally {
								if (rs != null) {
									try {
										rs.close();
									} catch (SQLException e) {
										logger.debug(e);
									}
								}
								if (stmt != null) {
									try {
										stmt.close();
									} catch (SQLException e) {
										logger.debug(e);
									}
								}
								if (connection != null) {
									try {
										connection.close();
									} catch (SQLException e) {
										logger.debug(e);
									}
								}
							}

							if (!edgeGroupValues.containsKey(group)) {
								edgeGroupValues.put(group, tuple);
							} else {
								edgeGroupValues.get(group).retainAll(tuple);
							}

							if (!edgeGroupToDataset.containsKey(group)) {
								edgeGroupToDataset.put(group, new HashSet<String>());
								edgeGroupToDataset.get(group).add(v1);
							} else {
								edgeGroupToDataset.get(group).add(v1);
							}
						}
					}
				}
			}
		} catch (Exception e) {
			throw new SpagoBIRuntimeException("Error during the initializing of the AssociativeLogicManager", e);
		}
	}

	private String getCachedTableName(String datasetLabel) throws EMFUserError {
		if (datasetToCachedTable.containsKey(datasetLabel)) {
			return datasetToCachedTable.get(datasetLabel);
		} else {
			String signature = DAOFactory.getDataSetDAO().loadDataSetByLabel(datasetLabel).getSignature();
			CacheItem cacheItem = cache.getMetadata().getCacheItem(signature);
			String tableName = cacheItem.getTable();
			datasetToCachedTable.put(datasetLabel, tableName);
			return tableName;
		}
	}

	private String getColumnNames(String associationNamesString, String datasetName) {
		String[] associationNames = associationNamesString.split(",");
		List<String> columnNames = new ArrayList<String>();
		for (String associationName : associationNames) {
			String columnName = AbstractJDBCDataset.encapsulateColumnName(datasetToAssociations.get(datasetName).get(associationName), dataSource);
			columnNames.add(columnName);
		}
		return StringUtils.join(columnNames.iterator(), ",");
	}

	@SuppressWarnings("unchecked")
	private void calculateDatasets(String dataset, EdgeGroup fromEdgeGroup, String filter) throws Exception {
		Set<EdgeGroup> groups = datasetToEdgeGroup.get(dataset);
		String tableName = getCachedTableName(dataset);

		// iterate over all the associations
		for (EdgeGroup group : groups) {
			String columnNames = getColumnNames(group.getOrderedEdgeNames(), dataset);
			String query = "SELECT DISTINCT " + columnNames + " FROM " + tableName + " WHERE " + filter;

			Connection connection = null;
			Statement statement = null;
			ResultSet rs = null;
			Set<String> distinctValues = null;
			try {
				connection = dataSource.getConnection();
				statement = connection.createStatement();
				rs = statement.executeQuery(query);
				distinctValues = getTupleOfValues(rs);
			} finally {
				if (rs != null) {
					try {
						rs.close();
					} catch (SQLException e) {
						logger.debug(e);
					}
				}
				if (statement != null) {
					try {
						statement.close();
					} catch (SQLException e) {
						logger.debug(e);
					}
				}
				if (connection != null) {
					try {
						connection.close();
					} catch (SQLException e) {
						logger.debug(e);
					}
				}
			}

			Set<String> baseSet = edgeGroupValues.get(group);
			Set<String> intersection = new HashSet<String>(CollectionUtils.intersection(baseSet, distinctValues));
			if (!intersection.equals(baseSet)) {
				if (intersection.size() > 0) {
					edgeGroupValues.put(group, intersection);

					for (String datasetInvolved : edgeGroupToDataset.get(group)) {
						if (!datasetInvolved.equals(dataset)) {
							columnNames = getColumnNames(group.getOrderedEdgeNames(), datasetInvolved);
							String inClauseColumns;
							String inClauseValues;
							if (intersection.size() > IN_CLAUSE_LIMIT) {
								inClauseColumns = "1," + columnNames;
								inClauseValues = getUnlimitedInClauseValues(intersection);
							} else {
								inClauseColumns = columnNames;
								inClauseValues = StringUtils.join(intersection.iterator(), ",");
							}
							String f = "(" + inClauseColumns + ") IN (" + inClauseValues + ")";
							// it will skip the current dataset, from which the filter is fired
							calculateDatasets(datasetInvolved, group, f);
						}
					}
				} else {
					Set<String> emptySet = new HashSet<String>();
					for (EdgeGroup edgeGroup : edgeGroupValues.keySet()) {
						edgeGroupValues.put(edgeGroup, emptySet);
					}
					return;
				}
			}
		}
	}

	private String getUnlimitedInClauseValues(Set<String> values) {
		Set<String> newValues = new HashSet<String>();
		for (String value : values) {
			newValues.add(value.replaceFirst("\\(", "(1,"));
		}
		return StringUtils.join(newValues.iterator(), ",");
	}

	private Set<String> getTupleOfValues(ResultSet rs) throws SQLException {
		String tuple;
		String stringDelimiter = "'";
		Set<String> tuples = new HashSet<String>();
		while (rs.next()) {
			tuple = "(";
			for (int i = 1; i <= rs.getMetaData().getColumnCount(); i++) {
				if (i != 1) {
					tuple += ",";
				}
				Object item = rs.getObject(i);
				tuple += stringDelimiter + (item == null ? null : item.toString()) + stringDelimiter;
			}
			tuple += ")";
			tuples.add(tuple);
		}
		return tuples;
	}

	// @SuppressWarnings("unused")
	// private PreparedStatement getPreparedQuery(Connection connection, String[] columnNames, String tableName) throws SQLException {
	// StringBuilder sb = new StringBuilder();
	// sb.append("SELECT DISTINCT");
	// sb.append(" ");
	// for (int i = 0; i < columnNames.length; i++) {
	// if (i != 0) {
	// sb.append(",");
	// }
	// sb.append("?");
	// }
	// sb.append("FROM");
	// sb.append(" ");
	// sb.append(tableName);
	// return connection.prepareStatement(sb.toString());
	// }
}
