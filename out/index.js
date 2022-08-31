"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simulateBuildTime = exports.printProjectBuildTimes = void 0;
var node_core_library_1 = require("@rushstack/node-core-library");
var os = require("os");
var MAX_CORES = 128;
function _extractBuildTimeMap(operationResults) {
    var buildTimeMap = new Map();
    if (operationResults) {
        Object.entries(operationResults).forEach(function (_a, index) {
            var _b, _c;
            var project = _a[0], operationTelemetry = _a[1];
            var durationSeconds = Number(((((_b = operationTelemetry.endTimestamp) !== null && _b !== void 0 ? _b : 0) - ((_c = operationTelemetry.startTimestamp) !== null && _c !== void 0 ? _c : 0)) /
                1000).toFixed(2));
            buildTimeMap.set(project, durationSeconds);
        });
    }
    return buildTimeMap;
}
function _calculateBuildTime(operationResults, buildTimeMap, numberOfCores) {
    var _a, _b, _c;
    // accumulativeBuildTimeMap <project, accumulated project build time>
    var accumulativeBuildTimeMap = new Map();
    // to simulate the number of CPUs
    if (!numberOfCores) {
        numberOfCores = os.cpus().length;
    }
    var processes = [];
    // Extract the Dependency Graph
    var dependencyGraph = [];
    Object.entries(operationResults).forEach(function (_a, index) {
        var project = _a[0], operationTelemery = _a[1];
        dependencyGraph.push({
            project: project,
            dependencies: operationTelemery.dependencies
        });
    });
    var _loop_1 = function () {
        // pop the first thing in the list:
        var project = dependencyGraph.shift();
        // project in scope has no dependencies:
        if (!project.dependencies.length) {
            accumulativeBuildTimeMap.set(project.project, (_a = buildTimeMap.get(project.project)) !== null && _a !== void 0 ? _a : -1);
        }
        else {
            var knownDependencyCount_1 = 0;
            var projectPushed_1 = false;
            project.dependencies.forEach(function (dependency) {
                // we don't have data for all dependencies yet, so push project to end of queue and process later:
                if (!accumulativeBuildTimeMap.has(dependency) && !projectPushed_1) {
                    dependencyGraph.push(project);
                    projectPushed_1 = true;
                }
                else {
                    knownDependencyCount_1 += 1;
                }
            });
            // we have data for all dependencies, find the max build time in dependencies (this is the limiting factor)
            if (knownDependencyCount_1 === project.dependencies.length) {
                var firstEndTime = 0;
                if (processes.length === numberOfCores) {
                    firstEndTime = Math.min.apply(Math, processes);
                    var firstEndTimeInd = processes.indexOf(firstEndTime);
                    processes.splice(firstEndTimeInd, 1);
                }
                processes.push(firstEndTime + ((_b = buildTimeMap.get(project.project)) !== null && _b !== void 0 ? _b : -1));
                var dependencyBuildTimings = project.dependencies.map(function (dependency) {
                    var _a;
                    return (_a = accumulativeBuildTimeMap.get(dependency)) !== null && _a !== void 0 ? _a : -1;
                });
                var projectStartTime = Math.max.apply(Math, __spreadArray([firstEndTime], dependencyBuildTimings, false));
                var accumulativeBuildTime = projectStartTime + ((_c = buildTimeMap.get(project.project)) !== null && _c !== void 0 ? _c : -1);
                accumulativeBuildTimeMap.set(project.project, Number(accumulativeBuildTime.toFixed(2)));
            }
        }
    };
    while (dependencyGraph.length !== 0) {
        _loop_1();
    }
    var totalBuildTime = Math.max.apply(Math, Array.from(accumulativeBuildTimeMap.values()));
    return totalBuildTime;
}
function _writeDependencyAnalysisSummary(terminal, buildTimeList) {
    var longestTaskName = 0;
    for (var _i = 0, buildTimeList_1 = buildTimeList; _i < buildTimeList_1.length; _i++) {
        var project = buildTimeList_1[_i];
        var nameLength = (project.project || '').length;
        if (nameLength > longestTaskName) {
            longestTaskName = nameLength;
        }
    }
    terminal.writeLine("If the following project had a 0 second build time, then the total build time will change by:");
    for (var _a = 0, buildTimeList_2 = buildTimeList; _a < buildTimeList_2.length; _a++) {
        var project = buildTimeList_2[_a];
        var padding = ' '.repeat(longestTaskName - (project.project || '').length);
        terminal.writeLine("  ".concat(project.project).concat(padding, "  ").concat(project.secondsSaved, " seconds saved"));
    }
}
function _writeSimulationSummary(terminal, simulatedBuildTimes) {
    terminal.writeLine("Simulating build time given number of cores:");
    simulatedBuildTimes.forEach(function (value, index) {
        var padding = ' '.repeat(20 - (index + 1).toString().length);
        terminal.writeLine("  Number of cores: ".concat(index + 1).concat(padding, " ").concat(value, " seconds"));
    });
    terminal.writeLine("The optimal number of cores to build your project is ".concat(simulatedBuildTimes.length - 1));
}
function printProjectBuildTimes(filename) {
    var _a, _b;
    var terminalProvider = new node_core_library_1.ConsoleTerminalProvider();
    var terminal = new node_core_library_1.Terminal(terminalProvider);
    var telemetryFile = node_core_library_1.JsonFile.load(filename)[0];
    var operationResults = (_a = telemetryFile.operationResults) !== null && _a !== void 0 ? _a : undefined;
    var buildTimeMap = _extractBuildTimeMap(operationResults);
    var machineInfo = (_b = telemetryFile.machineInfo) !== null && _b !== void 0 ? _b : {};
    if (!operationResults) {
        throw new Error("The telemetry file does not have the field 'telemetryFile'");
    }
    var totalBuildTime = _calculateBuildTime(operationResults, buildTimeMap);
    terminal.writeLine("\nThe original build took ".concat(totalBuildTime, " seconds to build with ").concat(machineInfo.machineCores, " CPU Cores.\n"));
    var buildTimeList = [];
    Object.entries(operationResults).forEach(function (_a) {
        var _b;
        var project = _a[0], operationTelemtry = _a[1];
        var buildTimePlaceHolder = (_b = buildTimeMap.get(project)) !== null && _b !== void 0 ? _b : -1;
        buildTimeMap.set(project, 0);
        var secondsSaved = totalBuildTime - _calculateBuildTime(operationResults, buildTimeMap);
        buildTimeList.push({
            project: project,
            secondsSaved: Number(secondsSaved.toFixed(2))
        });
        buildTimeMap.set(project, buildTimePlaceHolder);
    });
    buildTimeList.sort(function (a, b) { return b.secondsSaved - a.secondsSaved; });
    _writeDependencyAnalysisSummary(terminal, buildTimeList);
}
exports.printProjectBuildTimes = printProjectBuildTimes;
function simulateBuildTime(filename) {
    var _a, _b;
    var terminalProvider = new node_core_library_1.ConsoleTerminalProvider();
    var terminal = new node_core_library_1.Terminal(terminalProvider);
    var telemetryFile = node_core_library_1.JsonFile.load(filename)[0];
    var operationResults = (_a = telemetryFile.operationResults) !== null && _a !== void 0 ? _a : undefined;
    var buildTimeMap = _extractBuildTimeMap(operationResults);
    var machineInfo = (_b = telemetryFile.machineInfo) !== null && _b !== void 0 ? _b : {};
    var simulatedBuildTimes = [];
    if (!operationResults) {
        throw new Error("The telemetry file does not have the field 'telemetryFile'");
    }
    var totalBuildTime = _calculateBuildTime(operationResults, buildTimeMap);
    terminal.writeLine("\nThe original build took ".concat(totalBuildTime, " seconds to build with ").concat(machineInfo.machineCores, " CPU Cores.\n"));
    for (var numCores = 1; numCores < MAX_CORES; numCores++) {
        var simulatedBuildTime = _calculateBuildTime(operationResults, buildTimeMap, numCores);
        if (simulatedBuildTimes.length === 0) {
            simulatedBuildTimes.push(simulatedBuildTime);
        }
        else {
            if (simulatedBuildTimes[simulatedBuildTimes.length - 1] * 0.999 > simulatedBuildTime) {
                simulatedBuildTimes.push(simulatedBuildTime);
            }
            else {
                simulatedBuildTimes.push(simulatedBuildTime);
                _writeSimulationSummary(terminal, simulatedBuildTimes);
                return;
            }
        }
    }
}
exports.simulateBuildTime = simulateBuildTime;
//# sourceMappingURL=index.js.map