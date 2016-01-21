package it.eng.spagobi.tools.crossnavigation.bo;

import java.util.ArrayList;
import java.util.List;

public class SimpleParameter {

	private String name;
	private String type;
	private List<SimpleParameter> links = new ArrayList<>();

	public SimpleParameter(String name, String type) {
		this.name = name;
		this.type = type;
	}

	/**
	 * @return the name
	 */
	public String getName() {
		return name;
	}

	/**
	 * @param name
	 *            the name to set
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * @return the type
	 */
	public String getType() {
		return type;
	}

	/**
	 * @param type
	 *            the type to set
	 */
	public void setType(String type) {
		this.type = type;
	}

	/**
	 * @return the emptyList
	 */
	public List<SimpleParameter> getEmptyList() {
		return links;
	}

	/**
	 * @param emptyList
	 *            the emptyList to set
	 */
	public void setEmptyList(List<SimpleParameter> links) {
		this.links = links;
	}

}
