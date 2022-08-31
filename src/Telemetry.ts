export interface ITelemetryData {
    /**
     * Command name
     * @example 'build'
     */
    readonly name: string;
    /**
     * Duration in seconds
     */
    readonly durationInSeconds: number;
    /**
     * The result of the command
     */
    readonly result: 'Succeeded' | 'Failed';
    /**
     * The millisecond-resolution timestamp of the telemetry logging
     * @example 1648001893024
     */
    readonly timestamp?: number;
    /**
     * The platform the command was executed on, reads from process.platform
     * @example darwin, win32, linux...
     */
    readonly platform?: string;
    /**
     * The rush version
     * @example 5.63.0
     */
    readonly rushVersion?: string;
    readonly extraData?: { [key: string]: string | number | boolean };
    /**
     * Detailed information about the host machine.
     */
    readonly machineInfo?: ITelemetryMachineInfo;
    /**
     * Only applicable to phased commands. Provides detailed results by operation.
     * Keys are operation names, values contain result, timing information, and dependencies.
     */
    readonly operationResults?: Record<string, ITelemetryOperationResult>;
}

export interface ITelemetryOperationResult {
    /**
     * The names of operations that this operation depends on.
     */
    dependencies: string[];
    /**
     * The status code for the operation.
     */
    result: string;
    /**
     * A timestamp in milliseconds (from `performance.now()`)when the operation started.
     * If the operation was blocked, will be `undefined`.
     */
    startTimestamp?: number;
    /**
     * A timestamp in milliseconds (from `performance.now()`) when the operation finished.
     * If the operation was blocked, will be `undefined`.
     */
    endTimestamp?: number;
}

export interface ITelemetryMachineInfo {
    /**
     * The CPU architecture
     * @example 'AMD64'
     */
    machineArchitecture: string;
    /**
     * The CPU
     */
    machineCPU: string;
    /**
     * The number of logical CPU cores.
     */
    machineCores: number;
    /**
     * The total amount of RAM on the machine, in MiB.
     */
    machineTotalMemoryMiB: number;
    /**
     * The amount of free RAM on the machine at the end of execution, in MiB.
     */
    machineFreeMemoryMiB: number;
}