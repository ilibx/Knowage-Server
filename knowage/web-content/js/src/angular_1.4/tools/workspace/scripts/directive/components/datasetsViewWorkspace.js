angular
	.module('datasets_view_workspace', [])
 
	/**
	 * The HTML content of the Recent view (recent documents).
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	.directive('datasetsViewWorkspace', function () {
	 	return {
	      	restrict: 'E',
	      	replace: 'true',
	      	templateUrl: '/knowage/js/src/angular_1.4/tools/workspace/templates/datasetsViewWorkspace.html',
	      	controller: datasetsController
	  	};
	})

function datasetsController($scope,sbiModule_restServices,sbiModule_translate,$mdDialog,sbiModule_config,$window,$mdSidenav,sbiModule_user,sbiModule_helpOnLine,sbiModule_messaging){
	$scope.selectedDataset = undefined;
	//$scope.lastDocumentSelected = null;
	$scope.showDatasettInfo = false;
	$scope.currentTab = "myDataSet";
    $scope.previewDatasetModel=[];
    $scope.previewDatasetColumns=[];
    $scope.startPreviewIndex=0;
    $scope.endPreviewIndex=0;
    $scope.totalItemsInPreview=0;
    $scope.previewPaginationEnabled=true; 
    
    $scope.itemsPerPage=15;
    $scope.datasetInPreview=undefined;
    
    
    $scope.datasetsInitial=[];  //all
	$scope.myDatasetsInitial= [];
	$scope.enterpriseDatasetsInitial=[];
	$scope.sharedDatasetsInitial=[];
    
	/**
	 * STEP 3
	 */
	$scope.allHeadersForStep3Preview = [];
	$scope.allRowsForStep3Preview = [];
	
	$scope.validationStatus = false;
    
    $scope.markNotDerived=function(datasets){
    	
    	for(i=0;i<datasets.length;i++){
    		
    		if($scope.notDerivedDatasets.indexOf(datasets[i].label)>-1){
    			datasets[i].derivated=false;
    			
    		}else{
    			datasets[i].derivated=true;		
    		}
    	}
    }
   
	/**
	 * load all datasets
	 */
	$scope.loadDatasets= function(){
		sbiModule_restServices.promiseGet("2.0/datasets/mydata", "")
		.then(function(response) {
			angular.copy(response.data.root,$scope.datasets);
			$scope.markNotDerived($scope.datasets);
			angular.copy($scope.datasets,$scope.datasetsInitial);
			console.info("[LOAD END]: Loading of All datasets is finished.");
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.load.error'));
		});
	}

	$scope.loadMyDatasets= function(){
		sbiModule_restServices.promiseGet("2.0/datasets/owned", "")
		.then(function(response) {
			angular.copy(response.data.root,$scope.myDatasets);
			$scope.markNotDerived($scope.myDatasets);
			angular.copy($scope.myDatasets,$scope.myDatasetsInitial);
			console.info("[LOAD END]: Loading of My datasets is finished.");
			
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.load.error'));
		});
	}
	
	$scope.loadEnterpriseDatasets= function(){
		sbiModule_restServices.promiseGet("2.0/datasets/enterprise", "")
		.then(function(response) {
			angular.copy(response.data.root,$scope.enterpriseDatasets);
			$scope.markNotDerived($scope.enterpriseDatasets);
			angular.copy($scope.enterpriseDatasets,$scope.enterpriseDatasetsInitial);
			console.info("[LOAD END]: Loading of Enterprised datasets is finished.");
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.load.error'));
		});
	}
	
	$scope.loadSharedDatasets= function(){
		sbiModule_restServices.promiseGet("2.0/datasets/shared", "")
		.then(function(response) {
			angular.copy(response.data.root,$scope.sharedDatasets);
			$scope.markNotDerived($scope.sharedDatasets);
		    angular.copy($scope.sharedDatasets,$scope.sharedDatasetsInitial);
			console.info("[LOAD END]: Loading of Shared datasets is finished.");
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.load.error'));
		});
	}
	
	$scope.loadNotDerivedDatasets= function(){
		sbiModule_restServices.promiseGet("2.0/datasets/listNotDerivedDataset", "")
		.then(function(response) {
			//angular.copy(response.data,$scope.notDerivedDatasets);
			$scope.extractNotDerivedLabels(response.data);
			console.info("[LOAD END]: Loading of Not derived datasets is finished.");
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.load.error'));
		});
	}
	
	$scope.loadNotDerivedDatasets();
	
	$scope.loadInitialForDatasets=function(){
		angular.copy($scope.datasets,$scope.datasetsInitial); 
		angular.copy($scope.myDatasets,$scope.myDatasetsInitial);
		angular.copy($scope.enterpriseDatasets,$scope.enterpriseDatasetsInitial);
		angular.copy($scope.sharedDatasets,$scope.sharedDatasetsInitial);
	};
	
	$scope.showDatasetDetails = function() {
		return $scope.showDatasetInfo && $scope.isSelectedDatasetValid();
	};
	
	
	$scope.isSelectedDatasetValid = function() {
		return $scope.selectedDataset !== undefined;
	};
	
	$scope.setDetailOpen = function(isOpen) {
		if (isOpen && !$mdSidenav('rightDs').isLockedOpen() && !$mdSidenav('rightDs').isOpen()) {
			$scope.toggleDatasetDetail();
		}

		$scope.showDatasetInfo = isOpen;
	};
	
	$scope.toggleDatasetDetail = function() {
		$mdSidenav('rightDs').toggle();
	};
	
	$scope.selectDataset= function ( dataset ) { 
		if (dataset !== undefined) {
			//$scope.lastDatasetSelected = dataset;
		}
		var alreadySelected = (dataset !== undefined && $scope.selectedDataset === dataset);
		$scope.selectedDataset = dataset;
		if (alreadySelected) {
			$scope.selectedDataset=undefined;
			$scope.setDetailOpen(!$scope.showDatasetDetail);
		} else {
			$scope.setDetailOpen(dataset !== undefined);
		}
	};
	
    $scope.shareDataset=function(dataset){
    	//console.log("in share");
//    	console.log(dataset);
    	var id=dataset.id;
//    	console.log(id);
        params={};
    	params.id=id;
    	config={};
    	config.params=params;
    	
    	sbiModule_restServices.promisePost("selfservicedataset/share","","",config)
		.then(function(response) {
//			          console.log(response);
			          // binds changed value to object
			          dataset.isPublic=response.data.isPublic;
			          if(response.data.isPublic){
			          sbiModule_messaging.showSuccessMessage(sbiModule_translate.load('sbi.workspace.dataset.share.success'),sbiModule_translate.load('sbi.workspace.dataset.success'));
			          }else{
			        	  
			            sbiModule_messaging.showSuccessMessage(sbiModule_translate.load('sbi.workspace.dataset.unshare.success'),sbiModule_translate.load('sbi.workspace.dataset.success'));	  
			          }
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.fail'));
		});
    	
    }
    
    $scope.showQbeDataset= function(dataset){
    	console.log(dataset);
	//	var actionName= 'QBE_ENGINE_FROM_FEDERATION_START_ACTION';
		var label= dataset.label;
		
		var url= datasetParameters.qbeFromDataSetServiceUrl
		       +'&dataset_label='+label;
//		var url= sbiModule_config.engineUrls.worksheetServiceUrl
//		         +'&ACTION_NAME='+actionName
//		         +'&dataset_label='+label;
		 $window.location.href=url;
    }
    
    $scope.extractNotDerivedLabels= function(datasets){
    	for(i=0;i<datasets.length;i++){
    		$scope.notDerivedDatasets.push(datasets[i].label);
    	}
    		
    }
    
    $scope.creationDatasetEnabled= function(){
    	
    return datasetParameters.CAN_CREATE_DATASET_AS_FINAL_USER==="true";
    	
    }

    $scope.showHelpOnline= function(dataset){
    	
    	sbiModule_helpOnLine.show(dataset.label);
    }    
    
    $scope.isSharingEnabled=function(){
        return $scope.currentTab==="myDataSet"; 
    }
    
    $scope.exportDataset= function(dataset){
       var actionName='EXPORT_EXCEL_DATASET_ACTION';
       
       var id=dataset.id;
       if(isNaN(id)){
    	   id=id.dsId;
       }
       
       var url= sbiModule_config.adapterPath
               +'?ACTION_NAME='+actionName
               +'&SBI_EXECUTION_ID=-1'
               +'&LIGHT_NAVIGATOR_DISABLED=TRUE'
               +'&id='+id;
       
       $window.location.href=url;
    }
    
    $scope.previewDataset= function(dataset){
    	
    	$scope.datasetInPreview=dataset;
    	if(dataset.meta.dataset.length>0){
    	$scope.totalItemsInPreview=dataset.meta.dataset[0].pvalue;
    	$scope.previewPaginationEnabled=true;
    	}else{
    		$scope.previewPaginationEnabled=false;
    	}
    	$scope.getPreviewSet($scope.datasetInPreview);
        
    	if($scope.totalItemsInPreview < $scope.itemsPerPage){
    		 $scope.endPreviewIndex= $scope.totalItemsInPreview	
    	}else{
    		 $scope.endPreviewIndex = $scope.itemsPerPage;
    	}
    	
    	
     	$mdDialog.show({
			  scope:$scope,
			  preserveScope: true,
		      controller: DatasetPreviewController,
		      templateUrl: sbiModule_config.contextName+'/js/src/angular_1.4/tools/workspace/templates/datasetPreviewDialogTemplate.html',  
		      clickOutsideToClose:false,
		      escapeToClose :false,
		      //fullscreen: true,
		      locals:{
		    	 // previewDatasetModel:$scope.previewDatasetModel,
		         // previewDatasetColumns:$scope.previewDatasetColumns 
		      }
		    });
   
    	
    	
    }
    
    $scope.getPreviewSet= function(dataset){
    	

    	params={};
    	params.start=$scope.startPreviewIndex;
    	params.limit=$scope.itemsPerPage;
    	params.page=0;
    	params.dataSetParameters=null;
    	params.sort=null;
    	params.valueFilter=null;
    	params.columnsFilter=null;
    	params.columnsFilterDescription=null;
    	params.typeValueFilter=null;
    	params.typeFilter=null;
    	
    	config={};
    	config.params=params;
    	sbiModule_restServices.promiseGet("selfservicedataset/values", dataset.label,"",config)
		.then(function(response) {
			//console.log(response.data);
		    angular.copy(response.data.rows,$scope.previewDatasetModel);
		    if( $scope.previewDatasetColumns.length==0){
			$scope.createColumnsForPreview(response.data.metaData.fields);
		    }
		
			
			//$scope.startPreviewIndex=$scope.startPreviewIndex=0+20;
			
		},function(response){
			sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.browser.folder.load.error'));
		});
    	
    	
    }
    
    $scope.createColumnsForPreview=function(fields){
    
    	for(i=1;i<fields.length;i++){
    	 var column={};
    	 column.label=fields[i].header;
    	 column.name=fields[i].name;
    	 
    	 $scope.previewDatasetColumns.push(column);
    	}
    	
    }
   
    $scope.addNewFileDataset=function(){
    	
      console.info("[ADD NEW DATASET]: Opening the Dataset wizard for creation of a new Dataset in the Workspace.");	
      
      /**
       * Initialize all the data needed for the 'dataset' object that we are sending towards the server when going to the Step 2 and ones that we are using
       * internally (such as 'limitPreviewChecked'). This initialization should be done whenever we are opening the Dataset wizard, since the behavior should 
       * be the reseting of all fields on the Step 1.
       * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
       */
      $scope.initializeDatasetWizard();
      
      $mdDialog.show({
		  scope:$scope,
		  preserveScope: true,
	      controller: DatasetCreateController,
	      templateUrl: sbiModule_config.contextName+'/js/src/angular_1.4/tools/workspace/templates/datasetCreateDialogTemplate.html',  
	      clickOutsideToClose: false,
	      escapeToClose :true,
	      //fullscreen: true,
	      locals:{
	    	 // previewDatasetModel:$scope.previewDatasetModel,
	         // previewDatasetColumns:$scope.previewDatasetColumns 
	      }
	    });
    }
    
  
    /**
	 * Set the currently active Datasets tab. Initially, the 'My Data Set' tab is selected (active). 
	 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
	 */
	$scope.currentDatasetsTab = "myDataSet";
	
    $scope.switchDatasetsTab = function(datasetsTab) {
    	
    	$scope.currentDatasetsTab = datasetsTab;
    
    	if($scope.selectedDataset !== undefined){
    		$scope.selectDataset(undefined);
         }
    	
    	if($scope.selectedCkan !== undefined){
    		$scope.selectCkan(undefined);
         }
    	
    	$scope.ckanDatasetsList=[];
    	$scope.selectedCkanRepo={};
    	$scope.ckanDatasetsListInitial=[];
    	
    }	
    
    $scope.getBackPreviewSet=function(){
    	 if($scope.startPreviewIndex-$scope.itemsPerPage < 0){
    		 $scope.startPreviewIndex=0; 
    		 $scope.endPreviewIndex=$scope.itemsPerPage;
    	 }else{
    		 $scope.endPreviewIndex=$scope.startPreviewIndex;
             $scope.startPreviewIndex= $scope.startPreviewIndex-$scope.itemsPerPage;
         
    	 }
    
    	 $scope.getPreviewSet($scope.datasetInPreview);
    	 
    	
    }
    
    $scope.getNextPreviewSet= function(){
    	 if($scope.startPreviewIndex+$scope.itemsPerPage > $scope.totalItemsInPreview){
    		 $scope.startPreviewIndex=$scope.totalItemsInPreview-($scope.totalItemsInPreview%$scope.itemsPerPage);
    		 $scope.endPreviewIndex=$scope.totalItemsInPreview;
    	 }else if($scope.startPreviewIndex+$scope.itemsPerPage == $scope.totalItemsInPreview){
    		 $scope.startPreviewIndex=$scope.totalItemsInPreview-$scope.itemsPerPage;
    		 $scope.endPreviewIndex=$scope.totalItemsInPreview;
    	 } else{
              $scope.startPreviewIndex= $scope.startPreviewIndex+$scope.itemsPerPage;
              $scope.endPreviewIndex=$scope.endPreviewIndex+$scope.itemsPerPage;
    	 }   
    	 
    	 
        	 $scope.getPreviewSet($scope.datasetInPreview);
        	 
    }
    
    function parseCkanRepository(){
    	var ckanUrls= datasetParameters.CKAN_URLS;
    	var ckanUrlsSplitted= ckanUrls.split("|");
    	
    	var repos=[];
    	
    	for(i=0;i<ckanUrlsSplitted.length-1;i+=2){
    		repo={};
    		repo.url=ckanUrlsSplitted[i];
    		repo.name=ckanUrlsSplitted[i+1];
    		repos.push(repo);
    	}
    	
    	return repos;
    }
    //CKAN 
    $scope.ckanRepos=parseCkanRepository();
    $scope.selectedCkanRepo={};
    $scope.ckanDatasetsList=[];
    $scope.ckanDatasetsListInitial=[];
	$scope.loadCkanDatasets=function(){
		var repo=$scope.selectedCkanRepo;
		params={};
		params.isTech=false;
		params.showDerivedDataset=false;
		params.ckanDs=true;
		params.ckanFilter="NOFILTER";
		params.showOnlyOwner=true;
		params.ckanOffset=0;
		params.ckanRepository=repo.url;
		
		config={};
		config.params=params;
		sbiModule_restServices.promiseGet("certificateddatasets", "","",config)
		.then(function(response) {
			//console.log(response.data);
            angular.copy(response.data.root,$scope.ckanDatasetsList);
            angular.copy($scope.ckanDatasetsList,$scope.ckanDatasetsListInitial);
		},function(response){
			sbiModule_restServices.errorHandler(response.data,"error");
		});
		
		
	}
	
	$scope.showCkanDetails = function() {
		return $scope.showCkanInfo && $scope.isSelectedCkanValid();
	};
	
	
	$scope.isSelectedCkanValid = function() {
		return $scope.selectedCkan !== undefined;
	};
	
	$scope.setCkanDetailOpen = function(isOpen) {
		if (isOpen && !$mdSidenav('rightCkan').isLockedOpen() && !$mdSidenav('rightCkan').isOpen()) {
			$scope.toggleCkanDetail();
		}

		$scope.showCkanInfo = isOpen;
	};
	
	$scope.toggleCkanDetail = function() {
		$mdSidenav('rightCkan').toggle();
	};
	
	$scope.selectCkan= function ( dataset ) { 
		if (dataset !== undefined) {
			//$scope.lastDatasetSelected = dataset;
		}
		var alreadySelected = (dataset !== undefined && $scope.selectedCkan === dataset);
		$scope.selectedCkan = dataset;
		if (alreadySelected) {
			$scope.selectedCkan=undefined;
			$scope.setCkanDetailOpen(!$scope.showCkanDetail);
		} else {
			$scope.setCkanDetailOpen(dataset !== undefined);
		}
	};
	
	$scope.showDetailCkan=function(ckan){
		
		$mdDialog.show({
  		  scope:$scope,
			  preserveScope: true,
		      controller: DialogCkanController,
		      templateUrl: sbiModule_config.contextName+'/js/src/angular_1.4/tools/workspace/templates/ckanDetailTemplate.html',  
		      clickOutsideToClose:false,
		      escapeToClose :false,
		      fullscreen: true,
		      locals:{ckan:ckan }
		    })
	}
    
    function DatasetPreviewController($scope,$mdDialog,$http){
		
		$scope.closeDatasetPreviewDialog=function(){
			 $scope.previewDatasetModel=[];
			 $scope.previewDatasetColumns=[];
			 $scope.startPreviewIndex=0;
			 $scope.endPreviewIndex=0;
			 $scope.totalItemsInPreview=0;
			 $scope.datasetInPreview=undefined;
			 
			 $mdDialog.cancel();	 
	    }
		
		
		
	}
	
    function DialogCkanController($scope,$mdDialog,ckan){
    	$scope.ckan=ckan;
    	$scope.closeCkanDetail=function(){
    		$mdDialog.cancel();
    	}
    	
    }

    $scope.editFileDataset = function (arg) {
//    	 console.log(arg);
//    	  $scope.initializeDatasetWizard();
//    	  $scope.dataset=arg;
//          $scope.dataset.xslSheetNumber=Number(arg.xslSheetNumber);
//          $scope.dataset.skipRows=Number(arg.skipRows);
//          $scope.dataset.limitRows=Number(arg.limitRows);
//          $scope.fileObj={};
//          $scope.fileObj.filename=arg.fileName;
//          $mdDialog.show({
//    		  scope:$scope,
//    		  preserveScope: true,
//    	      controller: DatasetCreateController,
//    	      templateUrl: sbiModule_config.contextName+'/js/src/angular_1.4/tools/workspace/templates/datasetCreateDialogTemplate.html',  
//    	      clickOutsideToClose: false,
//    	      escapeToClose :true,
//    	      //fullscreen: true,
//    	      locals:{
//    	    	 // previewDatasetModel:$scope.previewDatasetModel,
//    	         // previewDatasetColumns:$scope.previewDatasetColumns 
//    	      }
//    	    });
    }
	
	function DatasetCreateController($scope,$mdDialog,sbiModule_restServices,sbiModule_config,multipartForm,$http){
		$scope.fileObj={};
		$scope.datasetWizardView=1;
		$scope.datasetCategories = [];
		$scope.datasetCategoryType = [];
		$scope.dsGenMetaProperty = [];
		$scope.dsMetaProperty = [];
		$scope.dsMetaValue = [];
		$scope.category = null;
		$scope.datasetColumns=[];
		$scope.submitStep1 = function() {
			
			var params = {};
			
			params.SBI_EXECUTION_ID = -1;
			params.isTech = false;
			params.showOnlyOwner = true;
			params.showDerivedDataset = false;
			
			$scope.dataset.id = "";
			$scope.dataset.type = "File";
			$scope.dataset.label = "";
			$scope.dataset.name = ""
			$scope.dataset.description = "";
			$scope.dataset.persist = false;
			$scope.dataset.tablePrefix = datasetParameters.TABLE_NAME_PREFIX;
			$scope.dataset.tableName = "";
			$scope.dataset.fileUploaded = true;
			
			
			if ($scope.dataset.limitRows == null)
				$scope.dataset.limitRows = "";
			
			$scope.dataset.meta = [];
			
			$http
			(
				{
					method: 'POST',
					url: sbiModule_config.host+'/knowage/restful-services/selfservicedataset/testDataSet',
					data: $scope.dataset,
					params:params,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					
					transformRequest: function(obj) {
						
						var str = [];
						
						for(var p in obj)
							str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
						
						return str.join("&");
						
					},
				}
			)
			.then
			(
				function successCallback(response) {

					if (!response.data.errors) {
						console.info("[SUCCESS]: The Step 1 form is submitted successfully.");
						$scope.datasetWizardView = $scope.datasetWizardView +1;
						angular.copy(response.data.meta,$scope.dataset.meta);
						angular.copy(response.data.datasetColumns,$scope.datasetColumns);
						$scope.prepareMetaForView();
						$scope.prepareDatasetForView();
					}
					else {
						console.info("[ERROR]: ",sbiModule_translate.load(response.data.errors[0].message));
						sbiModule_messaging.showErrorMessage(sbiModule_translate.load(response.data.errors[0].message), 'Error!');
					}
				}, 
					
				function errorCallback(response) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
					console.info("[FAILURE]: The form cannot be submitted because of some failure.");
					console.log(response);
					sbiModule_messaging.showErrorMessage("Failure!", 'Error!');
				}
			);
		}
		
		$scope.submitStep2 = function() {
			
			$scope.dataset.isPublicDS = false;
			$scope.dataset.datasetMetadata={};
			$scope.dataset.datasetMetadata.version=1;
			$scope.dataset.datasetMetadata.dataset=[];
			$scope.dataset.datasetMetadata.columns=[];
			angular.copy($scope.dataset.meta.dataset,$scope.dataset.datasetMetadata.dataset);
			angular.copy($scope.dataset.meta.columns,$scope.dataset.datasetMetadata.columns);
	  
			c=$scope.dataset.datasetMetadata.columns;
			for (var i = 0; i < c.length; i++) {
				delete c[i].columnView;
				delete c[i].pvalueView;
				delete c[i].pnameView;
				delete c[i].dsMetaValue;
			}
			
			d=$scope.dataset.datasetMetadata.dataset;
			for (var i = 0; i < d.length; i++) {
				delete d[i].pvalueView;
				delete d[i].pnameView;
			}
			
			$scope.dataset.datasetMetadata = JSON.stringify($scope.dataset.datasetMetadata);
			$scope.dataset.limitPreview = $scope.limitPreviewChecked;
			$scope.dataset.page = 1;
			$scope.dataset.start = "";
			$scope.dataset.page = 10;
			
			console.log($scope.dataset);
				
			var params = {};
				
			params.SBI_EXECUTION_ID = -1;
				
			$http
			(
				{
					method: 'POST',
					url: sbiModule_config.host+'/knowage/restful-services/selfservicedataset/getDataStore',
					data: $scope.dataset,
					params: params,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					
					transformRequest: function(obj) {
						
						var str = [];
						
						for(var p in obj)
							str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
						
						return str.join("&");
						
					},
				}
			)
			.then
			(
				function successCallback(response) {

					console.log("SUCCESS");					
					console.log(response.data);
					
					if (!response.data.errors) {
						console.info("[SUCCESS]: The Step 2 form is submitted successfully.");
						// Take the meta data from resulting JSON object (needed for the table's header)
						$scope.validationStatus = true;
						$scope.resultMetaDataStep2 = [];
						$scope.resultRowsStep2 = [];
						angular.copy(response.data.metaData.fields,$scope.resultMetaDataStep2);
						// Take all results (pure data) for rows of the Angular table
						angular.copy(response.data.rows,$scope.resultRowsStep2);
						$scope.collectHeadersForStep3Preview();
						$scope.datasetWizardView = $scope.datasetWizardView +1;
					}
					else {
						console.info("[ERROR]: ",sbiModule_translate.load(response.data.errors[0].message));
						$scope.validationStatus = false;
						sbiModule_messaging.showErrorMessage(sbiModule_translate.load(response.data.errors[0].message), 'Error!');
					}
				}, 
				
				function errorCallback(response) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
					console.info("[FAILURE]: The form cannot be submitted because of some failure.");
					console.log(response);
					$scope.validationStatus = false;
					sbiModule_messaging.showErrorMessage("Failure!", 'Error!');
				}
			);
		}
		
		/**
		 * Final submit
		 */
		$scope.submitStep4 = function() {
			
			$scope.dataset.isPublicDS = false;
//			$scope.dataset.meta = '{"version":1,"dataset":[],"columns":[{"column":"country","pname":"Type","pvalue":"String"},{"column":"country","pname":"fieldType","pvalue":"ATTRIBUTE"},{"column":"region","pname":"Type","pvalue":"String"},{"column":"region","pname":"fieldType","pvalue":"ATTRIBUTE"},{"column":"province","pname":"Type","pvalue":"String"},{"column":"province","pname":"fieldType","pvalue":"ATTRIBUTE"},{"column":"store_sales_promo_2012","pname":"Type","pvalue":"Double"},{"column":"store_sales_promo_2012","pname":"fieldType","pvalue":"MEASURE"},{"column":"unit_sales_promo_2012","pname":"Type","pvalue":"Double"},{"column":"unit_sales_promo_2012","pname":"fieldType","pvalue":"MEASURE"},{"column":"store_sales_promo_2013","pname":"Type","pvalue":"Double"},{"column":"store_sales_promo_2013","pname":"fieldType","pvalue":"MEASURE"},{"column":"unit_sales_promo_2013","pname":"Type","pvalue":"Double"},{"column":"unit_sales_promo_2013","pname":"fieldType","pvalue":"MEASURE"}]}';
			$scope.dataset.meta = $scope.dataset.datasetMetadata;
			delete $scope.dataset['datasetMetadata'];
			//console.log("meta",$scope.dataset.meta);
				
			var d = new Date();
			var label = 'ds__' + d.getTime()%10000000; 
			
			$scope.dataset.label = label;
			
			console.log($scope.dataset);
			
			var params = {};
			params.showDerivedDataset=false;
			params.SBI_EXECUTION_ID = -1;
			params.isTech = false;
			params.showOnlyOwner=true;
				
			var str = [];
			
			for(var p in $scope.dataset)
				str.push(encodeURIComponent(p) + "=" + encodeURIComponent($scope.dataset[p]));
			
			
			str.join("&");
			
			console.log(str.join("&"));
			
			/*sbiModule_restServices.promisePost("selfservicedataset","save?SBI_EXECUTION_ID=-1&isTech=false&showOnlyOwner=true&showDerivedDataset=false","",str)
			.then(function(response) {
				          console.log(response);
				          // binds changed value to object
//				          dataset.isPublic=response.data.isPublic;
//				          if(response.data.isPublic){
//				          sbiModule_messaging.showSuccessMessage(sbiModule_translate.load('sbi.workspace.dataset.share.success'),sbiModule_translate.load('sbi.workspace.dataset.success'));
//				          }else{
//				        	  
//				            sbiModule_messaging.showSuccessMessage(sbiModule_translate.load('sbi.workspace.dataset.unshare.success'),sbiModule_translate.load('sbi.workspace.dataset.success'));	  
//				          }
			},function(response){
				sbiModule_restServices.errorHandler(response.data,sbiModule_translate.load('sbi.workspace.dataset.fail'));
			});*/
			
			$http
			(
				{
					method: 'POST',
					url: sbiModule_config.host+'/knowage/restful-services/selfservicedataset/save',
					data: $scope.dataset,
					params: params,
					headers: {'Content-Type': 'application/x-www-form-urlencoded'},
					
					transformRequest: function(obj) {
						
						var str = [];
						
						for(var p in obj)
							str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
						
						console.log(str.join("&"));
						return str.join("&");
						
					},
				}
			)
			.then
			(
				function successCallback(response) {

					console.log("SUCCESS aaaaa");					
					console.log(response.data);
					
					if (!response.data.errors) {
						console.info("[SUCCESS]: The Step 2 form is submitted successfully.");
						// Take the meta data from resulting JSON object (needed for the table's header)
						$scope.validationStatus = true;
						$scope.resultMetaDataStep2 = [];
						$scope.resultRowsStep2 = [];
						angular.copy(response.data.metaData.fields,$scope.resultMetaDataStep2);
						// Take all results (pure data) for rows of the Angular table
						angular.copy(response.data.rows,$scope.resultRowsStep2);
						$scope.collectHeadersForStep3Preview();
						$scope.datasetWizardView = $scope.datasetWizardView +1;
					}
					else {
						console.info("[ERROR]: ",sbiModule_translate.load(response.data.errors[0].message));
						$scope.validationStatus = false;
						sbiModule_messaging.showErrorMessage(sbiModule_translate.load(response.data.errors[0].message), 'Error!');
					}
				}, 
				
				function errorCallback(response) {
				// called asynchronously if an error occurs
				// or server returns response with an error status.
					console.info("[FAILURE]: The form cannot be submitted because of some failure.");
					console.log(response);
//					$scope.validationStatus = false;
//					sbiModule_messaging.showErrorMessage("Failure!", 'Error!');
				}
			);
			
		}
		
		$scope.toggleDWVNext = function() {
		
//			console.log($scope.dataset);
			
			/**
			 * Call this service only when submitting the form data from the Step 1.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			switch($scope.datasetWizardView) {
				case 1: $scope.submitStep1(); break;
				case 2: $scope.submitStep2(); break;
				case 4: $scope.submitStep4(); break;
			}			
			
			/**
			 * Bigger then 1, because for the Step 1 we will move to the next step in the 'submitStep1()', according to the state of success of the service call.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net) 
			 */
			if($scope.datasetWizardView>2 && $scope.datasetWizardView<4){
				$scope.datasetWizardView = $scope.datasetWizardView +1;
			}
		}
		
		$scope.toggleDWVBack = function() {
			if($scope.datasetWizardView>1&&$scope.datasetWizardView<5){ 
				$scope.datasetWizardView = $scope.datasetWizardView -1;
			}
		}
			
		/**
		 * Collect all table headers so we can preview results in the Step 3.
		 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
		 */
		$scope.collectHeadersForStep3Preview = function() {			
			
			$scope.allHeadersForStep3Preview = [];
			
			for (i=0; i<$scope.resultMetaDataStep2.length; i++) {
				
				var temp = {};
				
				temp['label'] = $scope.resultMetaDataStep2[i].header;
				temp['name'] = 'column_' + (i+1);
				
				$scope.allHeadersForStep3Preview.push(temp);
				
		}
		
		}
		
		$scope.closeDatasetCreateDialog=function(){
			$mdDialog.cancel();
			$scope.datasetWizardView=1;
			
			/**
			 * Empty the object that was potentially uploaded previously when closing the dialog box.
			 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
			 */
			$scope.dataset = {};
			$scope.limitPreviewChecked = false;
			$scope.category = {};
		}
		
		loadDatasetValues= function(a,b){
			sbiModule_restServices.promiseGet(a,b)
			.then(function(response) {
				console.log(response.data);
				if(b=="") {
				angular.copy(response.data,$scope.datasetCategories)
				} else if(b=="?DOMAIN_TYPE=CATEGORY_TYPE"){
					angular.copy(response.data,$scope.datasetCategoryType)
					/**
					 * Initialize the category type for the new Dataset when the Dataset wizard appears in the Workspace. The initial value should be the first one in an
					 * array of all category types that are available (i.e. 'Cat1').
					 * @author Danilo Ristovski (danristo, danilo.ristovski@mht.net)
					 */
					$scope.chooseCategory($scope.datasetCategoryType[0]);
				} else if(b=="?DOMAIN_TYPE=DS_GEN_META_PROPERTY"){
					angular.copy(response.data,$scope.dsGenMetaProperty)
				} else if(b=="?DOMAIN_TYPE=DS_META_PROPERTY"){
					angular.copy(response.data,$scope.dsMetaProperty)
				} else if(b=="?DOMAIN_TYPE=DS_META_VALUE"){
					angular.copy(response.data,$scope.dsMetaValue)
				}
			},function(response){
				sbiModule_restServices.errorHandler(response.data,"faild to load data for"+b);
			});
		}
			
		loadDatasetValues("domainsforfinaluser/listValueDescriptionByType","");
		loadDatasetValues("domainsforfinaluser/listValueDescriptionByType","?DOMAIN_TYPE=CATEGORY_TYPE");
		loadDatasetValues("domainsforfinaluser/listValueDescriptionByType","?DOMAIN_TYPE=DS_GEN_META_PROPERTY");
		loadDatasetValues("domainsforfinaluser/listValueDescriptionByType","?DOMAIN_TYPE=DS_META_PROPERTY");
		loadDatasetValues("domainsforfinaluser/listValueDescriptionByType","?DOMAIN_TYPE=DS_META_VALUE");
	    
		$scope.uploadFile= function(){
		
        	multipartForm.post(sbiModule_config.contextName +"/restful-services/selfservicedataset/fileupload",$scope.fileObj).success(

					function(data,status,headers,config){
						if(data.hasOwnProperty("errors")){						
							console.info("[UPLOAD]: DATA HAS ERRORS PROPERTY!");		
							sbiModule_messaging.showErrorMessage($scope.fileObj.fileName+" could not be uploaded."+data.errors[0].message, 'Error!');
						}else{
						
							console.info("[UPLOAD]: SUCCESS!");
						sbiModule_messaging.showSuccessMessage($scope.fileObj.fileName+" successfully uploaded", 'Success!');
						
						$scope.file={};
							$scope.dataset.fileType = data.fileType;
							$scope.dataset.fileName = data.fileName;
						}
					}).error(function(data, status, headers, config) {
						console.info("[UPLOAD]: FAIL! Status: "+status);
						sbiModule_messaging.showErrorMessage($scope.fileObj.fileName+" could not be uploaded."+data.errors[0].message, 'Error!');
					});
        	
        }
		
		$scope.prepareMetaForView=function(){
			$scope.prepareMetaValue($scope.dataset.meta.columns);
			for(i=0; i< $scope.dataset.meta.columns.length;i++){
				loc = $scope.dataset.meta.columns[i];
			var pname = loc.pname;
			loc.dsMetaValue=[];
			loc.dsMetaValue=$scope.filterMetaValue(pname);	
			loc.columnView='<md-select ng-model=row.column class="noMargin"><md-option ng-repeat="col in scopeFunctions.datasetColumns" value="{{col.columnName}}">{{col.columnName}}</md-option></md-select>';
			loc.pnameView='<md-select ng-model=row.pname class="noMargin"><md-option ng-repeat="col in scopeFunctions.dsMetaProperty" value="{{col.VALUE_CD}}" ng-click="scopeFunctions.filterMetaValues(col.VALUE_CD,row)">{{col.VALUE_NM}}</md-option></md-select>';
			loc.pvalueView='<md-select ng-model=row.pvalue class="noMargin"><md-option ng-repeat="col in row.dsMetaValue" value="{{col.VALUE_CD}}">{{col.VALUE_NM}}</md-option></md-select>';	
			}	
		}
		
		$scope.prepareDatasetForView = function() {
			var datasets = $scope.dataset.meta.dataset
			for (var i = 0; i < datasets.length; i++) {
				datasets[i].pnameView = '<md-select ng-model=row.pname class="noMargin"><md-option ng-repeat="col in scopeFunctions.dsGenMetaProperty" value="{{col.VALUE_CD}}">{{col.VALUE_NM}}</md-option></md-select>';
				dataset[i].pvalueView = ' <input ng-model="row.pvalue"></input>';
			}
		}
		
		$scope.filterMetaValue = function(pname){
			var filteredMetaValues = [];
			if(pname.toLowerCase()==="type".toLowerCase()){
    			for(j=0;j<$scope.dsMetaValue.length;j++){
    			 if($scope.dsMetaValue[j].VALUE_CD.toLowerCase()==="string".toLowerCase()||
    					 $scope.dsMetaValue[j].VALUE_CD.toLowerCase()==="double".toLowerCase()||
    					 $scope.dsMetaValue[j].VALUE_CD.toLowerCase()==="integer".toLowerCase()){
    				 filteredMetaValues.push($scope.dsMetaValue[j]);
    			 }    			
    		}
    			
    			
    		}else if(pname.toLowerCase()==="fieldType".toLowerCase()){
    			for(j=0;j<$scope.dsMetaValue.length;j++){
       			 if($scope.dsMetaValue[j].VALUE_CD.toLowerCase()==="attribute".toLowerCase()||
       			    $scope.dsMetaValue[j].VALUE_CD.toLowerCase()==="measure".toLowerCase()){
       				filteredMetaValues.push($scope.dsMetaValue[j]);
       			 }
       				
       			
       			}
    			
    		}else{
    			
    			angular.copy($scope.dsMetaValue,filteredMetaValues);
    			
    		}
			return filteredMetaValues;
		}
		
		$scope.prepareMetaValue=function(values){
			
			for(i=0;i<values.length;i++){
				
				if (values[i].pname.toUpperCase() == 'type'.toUpperCase()){
					values[i].pname=values[i].pname.toLowerCase();
					typeValue = values[i].pvalue;
					typeValue = typeValue.replace("java.lang.","");
					values[i].pvalue = typeValue;
				}
			}
		}
		
		
	}
    
}