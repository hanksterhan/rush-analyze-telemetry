import { ConsoleTerminalProvider, Terminal, JsonFile } from "@rushstack/node-core-library";
import { ITelemetryData, ITelemetryMachineInfo, ITelemetryOperationResult } from './Telemetry';
import * as os from 'os';

const MAX_CORES: number = 128;

interface IBuildTimeSavedRecord {
  project: string;
  secondsSaved: number;
}
  
interface IDependencyGraphEntry {
  project: string;
  dependencies: string[];
}

function _extractBuildTimeMap(
  operationResults: Record<string, ITelemetryOperationResult> | undefined
  ): Map<string, number> {
  const buildTimeMap: Map<string, number> = new Map();
  if (operationResults) {
    Object.entries(operationResults).forEach(
    ([project, operationTelemetry]: [string, ITelemetryOperationResult], index) => {
      const durationSeconds: number = Number(
      (
        ((operationTelemetry.endTimestamp ?? 0) - (operationTelemetry.startTimestamp ?? 0)) /
        1000
      ).toFixed(2)
      );
      buildTimeMap.set(project, durationSeconds);
    }
    );
  }
  return buildTimeMap;
}

function _calculateBuildTime(
  operationResults: Record<string, ITelemetryOperationResult>,
  buildTimeMap: Map<string, number>,
  numberOfCores?: number
  ): number {
  // accumulativeBuildTimeMap <project, accumulated project build time>
  const accumulativeBuildTimeMap: Map<string, number> = new Map();

  // to simulate the number of CPUs
  if (!numberOfCores) {
    numberOfCores = os.cpus().length;
  }
  const processes: number[] = [];

  // Extract the Dependency Graph
  const dependencyGraph: IDependencyGraphEntry[] = [];
  Object.entries(operationResults).forEach(
    ([project, operationTelemery]: [string, ITelemetryOperationResult], index) => {
    dependencyGraph.push({
      project,
      dependencies: operationTelemery.dependencies
    } as IDependencyGraphEntry);
    }
  );

  while (dependencyGraph.length !== 0) {
    // pop the first thing in the list:
    const project: IDependencyGraphEntry = dependencyGraph.shift() as IDependencyGraphEntry;

    // project in scope has no dependencies:
    if (!project.dependencies.length) {
    accumulativeBuildTimeMap.set(project.project, buildTimeMap.get(project.project) ?? -1);
    } else {
    let knownDependencyCount: number = 0;
    let projectPushed: boolean = false;
    project.dependencies.forEach((dependency) => {
      // we don't have data for all dependencies yet, so push project to end of queue and process later:
      if (!accumulativeBuildTimeMap.has(dependency) && !projectPushed) {
      dependencyGraph.push(project);
      projectPushed = true;
      } else {
      knownDependencyCount += 1;
      }
    });
    // we have data for all dependencies, find the max build time in dependencies (this is the limiting factor)
    if (knownDependencyCount === project.dependencies.length) {
      let firstEndTime: number = 0;
      if (processes.length === numberOfCores) {
      firstEndTime = Math.min(...processes);
      const firstEndTimeInd: number = processes.indexOf(firstEndTime);
      processes.splice(firstEndTimeInd, 1);
      }
      processes.push(firstEndTime + (buildTimeMap.get(project.project) ?? -1));
      const dependencyBuildTimings: number[] = project.dependencies.map((dependency) => {
      return accumulativeBuildTimeMap.get(dependency) ?? -1;
      });
      const projectStartTime: number = Math.max(firstEndTime, ...dependencyBuildTimings);
      const accumulativeBuildTime: number = projectStartTime + (buildTimeMap.get(project.project) ?? -1);
      accumulativeBuildTimeMap.set(project.project, Number(accumulativeBuildTime.toFixed(2)));
    }
    }
  }
  const totalBuildTime: number = Math.max(...Array.from(accumulativeBuildTimeMap.values()));
  return totalBuildTime;
}

function _writeDependencyAnalysisSummary(
  terminal: Terminal,
  buildTimeList: IBuildTimeSavedRecord[]
): void {
  let longestTaskName: number = 0;
  for (const project of buildTimeList) {
    const nameLength: number = (project.project || '').length;
    if (nameLength > longestTaskName) {
    longestTaskName = nameLength;
    }
  }

  terminal.writeLine(
    `If the following project had a 0 second build time, then the total build time will change by:`
  );

  for (const project of buildTimeList) {
    const padding: string = ' '.repeat(longestTaskName - (project.project || '').length);
    terminal.writeLine(`  ${project.project}${padding}  ${project.secondsSaved} seconds saved`);
  }
}

function _writeSimulationSummary(terminal: Terminal, simulatedBuildTimes: number[]): void {
  terminal.writeLine(`Simulating build time given number of cores:`);

  simulatedBuildTimes.forEach((value, index) => {
    const padding: string = ' '.repeat(20 - (index + 1).toString().length);
    terminal.writeLine(`  Number of cores: ${index + 1}${padding} ${value} seconds`);
  });

  terminal.writeLine(
    `The optimal number of cores to build your project is ${simulatedBuildTimes.length - 1}`
  );
}

export function printProjectBuildTimes(filename: string) {
  const terminalProvider: ConsoleTerminalProvider = new ConsoleTerminalProvider();
  const terminal: Terminal = new Terminal(terminalProvider);

  const telemetryFile: ITelemetryData = JsonFile.load(filename)[0];
  const operationResults: Record<string, ITelemetryOperationResult> | undefined =
    telemetryFile.operationResults ?? undefined;
  const buildTimeMap: Map<string, number> = _extractBuildTimeMap(operationResults);
  const machineInfo: ITelemetryMachineInfo = telemetryFile.machineInfo ?? ({} as ITelemetryMachineInfo);

  if (!operationResults) {
    throw new Error(`The telemetry file does not have the field 'telemetryFile'`);
  }
  const totalBuildTime: number = _calculateBuildTime(operationResults, buildTimeMap);
  terminal.writeLine(
    `\nThe original build took ${totalBuildTime} seconds to build with ${machineInfo.machineCores} CPU Cores.\n`
  );
  const buildTimeList: IBuildTimeSavedRecord[] = [];

  Object.entries(operationResults).forEach(
    ([project, operationTelemtry]: [string, ITelemetryOperationResult]) => {
    const buildTimePlaceHolder: number = buildTimeMap.get(project) ?? -1;
    buildTimeMap.set(project, 0);
    const secondsSaved: number =
      totalBuildTime - _calculateBuildTime(operationResults, buildTimeMap);
    buildTimeList.push({
      project,
      secondsSaved: Number(secondsSaved.toFixed(2))
    });
    buildTimeMap.set(project, buildTimePlaceHolder);
    }
  );

  buildTimeList.sort((a, b) => b.secondsSaved - a.secondsSaved);

  _writeDependencyAnalysisSummary(terminal, buildTimeList);
}

export function simulateBuildTime(filename: string): void {
  const terminalProvider: ConsoleTerminalProvider = new ConsoleTerminalProvider();
  const terminal: Terminal = new Terminal(terminalProvider);
  
  const telemetryFile: ITelemetryData = JsonFile.load(filename)[0];
  const operationResults: Record<string, ITelemetryOperationResult> | undefined =
    telemetryFile.operationResults ?? undefined;
  const buildTimeMap: Map<string, number> = _extractBuildTimeMap(operationResults);
  const machineInfo: ITelemetryMachineInfo = telemetryFile.machineInfo ?? ({} as ITelemetryMachineInfo);

  const simulatedBuildTimes: number[] = [];

  if (!operationResults) {
    throw new Error(`The telemetry file does not have the field 'telemetryFile'`);
  }

  const totalBuildTime: number = _calculateBuildTime(operationResults, buildTimeMap);
  terminal.writeLine(
    `\nThe original build took ${totalBuildTime} seconds to build with ${machineInfo.machineCores} CPU Cores.\n`
  );

  for (let numCores: number = 1; numCores < MAX_CORES; numCores++) {
    const simulatedBuildTime: number = _calculateBuildTime(operationResults, buildTimeMap, numCores);
    if (simulatedBuildTimes.length === 0) {
      simulatedBuildTimes.push(simulatedBuildTime);
    } else {
      if (simulatedBuildTimes[simulatedBuildTimes.length - 1] * 0.999 > simulatedBuildTime) {
        simulatedBuildTimes.push(simulatedBuildTime);
      } else {
        simulatedBuildTimes.push(simulatedBuildTime);
        _writeSimulationSummary(terminal, simulatedBuildTimes);
        return;
      }
    }
  }
}