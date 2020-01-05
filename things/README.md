# Create devices and their certificates

This was copied from the iot-demo project. It's not self-contained so
it won't work on its own yet (it uses the already-created policy from
the iot-demo project).

## Todo

- figure out what the actual policy needs are and add those to the CDK code
- get rid of device singletons. i.e. we should be able to
  provision any number of garages and serve all of them with the API

## Run (create or update devices)

`./devices.sh`
