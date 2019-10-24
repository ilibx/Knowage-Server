/*
Knowage, Open Source Business Intelligence suite
Copyright (C) 2016 Engineering Ingegneria Informatica S.p.A.

Knowage is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published by
the Free Software Foundation, either version 3 of the License, or
 (at your option) any later version.

Knowage is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

angular
	.module('cockpitModule')
	.controller('pythonWidgetEditControllerFunction', pythonWidgetEditControllerFunction)

function pythonWidgetEditControllerFunction(
		$scope,
		finishEdit,
		model,
		sbiModule_translate,
		$mdDialog,
		mdPanelRef) {

	$scope.translate = sbiModule_translate;
	$scope.newModel = angular.copy(model);

	$scope.newModel.types = [
        "img",
        "text",
        "html",
        "bokeh"
    ];

	$scope.editorOptionsPython = {
        theme: 'eclipse',
        lineWrapping: true,
        lineNumbers: true,
        mode: {name: "python"},
        onLoad: $scope.codemirrorLoaded
	};

	//codemirror initializer
	$scope.codemirrorLoaded = function (_editor) {
		$scope._doc = _editor.getDoc();
		$scope._editor = _editor;
		_editor.focus();
		$scope._doc.markClean()
		_editor.on("beforeChange", function () {});
		_editor.on("change", function () {});
	};

	$scope.saveConfiguration = function () {
		mdPanelRef.close();
		angular.copy($scope.newModel,model);
		$scope.$destroy();
		finishEdit.resolve();
	};

	$scope.cancelConfiguration = function () {
		mdPanelRef.close();
		$scope.$destroy();
		finishEdit.reject();
	};

}
