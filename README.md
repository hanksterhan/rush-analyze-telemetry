# rush-analyze-telemetry

## Usage
```
$ rush analyze-telemetry [-b] [-s] -f FILENAME

Analyzes the provided Rush telemetry file to provide insight into the build timing data. The --build-times flag will identify the projects which are chokepoints during the build. Reducing the build times of these projects will directly reduce the overall build time by 1 second. The --simulate flag will identify the optimal number of CPU cores to build your project to help teams make more informed decisions about the number of CPU cores to use to build their project. Note that these functions only work on telemetry files produced by Rush version `^5.77.0`

Optional arguments:

-b, --build-times        Identifies the projects which are chokepoints during the build
-s, --simulate           Identifies the optimal number of CPU cores to build your project
```

## Example Output
```
$ rush analyze-telemetry --build-times -f telemetry_timestamp.json

The original build took 68.04 seconds to build with 10 CPU Cores.

If the following project had a 0 second build time, then the total build time will change by:
  @microsoft/rush-lib (build)                                 14.8 seconds saved
  install-test-workspace (build)                              3.25 seconds saved
  api-documenter-scenarios (build)                            1.24 seconds saved
  api-documenter-test (build)                                 1.24 seconds saved
  heft-sass-test (build)                                      1.24 seconds saved
  @rushstack/heft-jest-plugin (build)                         1.02 seconds saved
  api-extractor-lib2-test (build)                             0.89 seconds saved
  heft-serverless-stack-tutorial (build)                      0.87 seconds saved
  heft-storybook-react-tutorial (build)                       0.87 seconds saved
  localization-plugin-test-02 (build)                         0.8 seconds saved
  heft-node-everything-esm-module-test (build)                0.68 seconds saved
  @rushstack/eslint-plugin (test)                             0.68 seconds saved
  @rushstack/package-deps-hash (test)                         0.68 seconds saved
  @rushstack/node-core-library (test)                         0.66 seconds saved
  heft-example-plugin-01 (build)                              0.65 seconds saved
  api-extractor-scenarios (build)                             0.63 seconds saved
  api-extractor-test-04 (build)                               0.63 seconds saved
  api-extractor-test-01 (build)                               0.61 seconds saved
  heft-node-everything-test (build)                           0.61 seconds saved
  @rushstack/eslint-plugin-security (test)                    0.61 seconds saved
  @microsoft/api-extractor (test)                             0.6 seconds saved
  heft-minimal-rig-usage-test (build)                         0.56 seconds saved
  heft-parameter-plugin (build)                               0.54 seconds saved
  api-extractor-test-02 (build)                               0.53 seconds saved
  api-extractor-lib1-test (build)                             0.52 seconds saved
  eslint-7-test (build)                                       0.52 seconds saved
  heft-action-plugin (build)                                  0.52 seconds saved
  api-extractor-lib3-test (build)                             0.48 seconds saved
  heft-fastify-test (build)                                   0.48 seconds saved
  heft-jest-reporters-test (build)                            0.48 seconds saved
  @rushstack/ts-command-line (test)                           0.47 seconds saved
  @rushstack/terminal (build)                                 0.43 seconds saved
  heft-example-plugin-02 (build)                              0.42 seconds saved
  heft-node-jest-tutorial (build)                             0.41 seconds saved
  @rushstack/localization-utilities (test)                    0.41 seconds saved
  @rushstack/webpack5-localization-plugin (test)              0.41 seconds saved
  ts-command-line-test (build)                                0.4 seconds saved
  heft-node-jest-tutorial (test)                              0.39 seconds saved
  heft-webpack-basic-tutorial (build)                         0.38 seconds saved
  heft-node-basic-tutorial (build)                            0.36 seconds saved
  packlets-tutorial (build)                                   0.36 seconds saved
  @rushstack/heft (test)                                      0.33 seconds saved
  heft-typescript-composite-test (build)                      0.32 seconds saved
  @microsoft/rushell (test)                                   0.32 seconds saved
  @rushstack/heft-config-file (test)                          0.32 seconds saved
  heft-webpack4-everything-test (build)                       0.3 seconds saved

  <-- retracted for sample output -->
```
```
$ rush analyze-telemetry --simulate -f telemetry_timestamp.json

The original build took 68.04 seconds to build with 10 CPU Cores.

Simulating build time given number of cores:
  Number of cores: 1                    468.8 seconds
  Number of cores: 2                    235.59 seconds
  Number of cores: 3                    157.73 seconds
  Number of cores: 4                    123.83 seconds
  Number of cores: 5                    105.21 seconds
  Number of cores: 6                    92.83 seconds
  Number of cores: 7                    84.18 seconds
  Number of cores: 8                    76.97 seconds
  Number of cores: 9                    71.89 seconds
  Number of cores: 10                   68.04 seconds
  Number of cores: 11                   64.56 seconds
  Number of cores: 12                   61.66 seconds
  Number of cores: 13                   59.61 seconds
  Number of cores: 14                   58.15 seconds
  Number of cores: 15                   56.97 seconds
  Number of cores: 16                   56.49 seconds
  Number of cores: 17                   55.94 seconds
  Number of cores: 18                   55.91 seconds
The optimal number of cores to build your project is 17
```
