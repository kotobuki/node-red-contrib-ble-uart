module.exports = function(RED) {
    var noble = require('@abandonware/noble');

    function BleUartNode(config) {
        RED.nodes.createNode(this, config);

        // The proprietary UART profile by Nordic Semiconductor
        var uartServiceUuid = '6e400001b5a3f393e0a9e50e24dcca9e';
        var txCharacteristicUuid = '6e400002b5a3f393e0a9e50e24dcca9e';
        var rxCharacteristicUuid = '6e400003b5a3f393e0a9e50e24dcca9e';

        var txCharacteristic = null;
        var rxCharacteristic = null;
        var writeWithoutResponse = false;

        var node = this;
        var localName = config.localName;
        if (localName === "") {
            node.error("Please specify a local name");
        }

        this.on('input', function(msg) {
            if (txCharacteristic) {
                // You can only send at most 20 bytes in a Bluetooth LE packet,
                // so slice the data into 20-byte chunks:
                while (msg.payload.length > 20) {
                    var output = msg.payload.slice(0, 19);
                    txCharacteristic.write(new Buffer(output), writeWithoutResponse);
                    msg.payload = data.slice(20);
                }

                // Send any remainder bytes less than the last 20:
                txCharacteristic.write(new Buffer(msg.payload), writeWithoutResponse);
            }
        });

        noble.on('stateChange', function(state) {
            if (state === 'poweredOn') {
                noble.startScanning([uartServiceUuid], false);
                node.status({ fill: "blue", shape: "ring", text: "BLE powered on" });
            } else {
                noble.stopScanning();
                node.status({ fill: "red", shape: "ring", text: "BLE powered off" });
            }
        });

        noble.on('scanStart', function() {
            node.log('Started scanning');
            node.status({ fill: "blue", shape: "ring", text: "Scanning..." });
        });

        noble.on('scanStop', function() {
            node.log('Stopped scanning');
            node.status({ fill: "blue", shape: "dot", text: "Scanning finished" });
        });

        noble.on('warning', function(message) {
            node.warn(message);
        });

        noble.on('discover', function(peripheral) {
            node.log('Discovered: ' + peripheral);

            if (peripheral.advertisement.localName !== localName) {
                // Ignore non-specified peripherals
                return;
            }

            // We found a peripheral, stop scanning
            noble.stopScanning();
            node.log('Found: ' + peripheral.advertisement.localName);
            node.status({ fill: "green", shape: "ring", text: "Device found" });

            peripheral.connect(function(err) {
                if (err) {
                    node.error('Error connecting: ' + err);
                    return;
                }

                node.log('Connected to ' + peripheral.advertisement.localName);
                node.status({ fill: "green", shape: "ring", text: "Device connected" });

                peripheral.discoverServices(null, function(err, services) {
                    if (err) {
                        node.error('Error discovering services: ' + err);
                        return;
                    }

                    node.log('Services: ' + services.length);
                    services.forEach(function(service) {
                        if (service.uuid !== uartServiceUuid) {
                            // Ignore non-UART services
                            return;
                        } else {
                            node.log('Found a UART service');
                        }

                        service.discoverCharacteristics(null, function(err, characteristics) {
                            characteristics.forEach(function(characteristic) {
                                if (txCharacteristicUuid === characteristic.uuid) {
                                    txCharacteristic = characteristic;

                                    if (characteristic.properties.indexOf("writeWithoutResponse") > -1) {
                                        writeWithoutResponse = true;
                                    }
                                    node.log('writeWithoutResponse: ' + writeWithoutResponse);

                                    node.log('Found a TX characteristic');
                                } else if (rxCharacteristicUuid === characteristic.uuid) {
                                    rxCharacteristic = characteristic;
                                    node.log('Found a RX characteristic');

                                    // Turn on notifications
                                    rxCharacteristic.notify(true);

                                    rxCharacteristic.on('read', function(data, notification) {
                                        node.log(data);

                                        // If you got a notification
                                        if (notification) {
                                            var msg = { "payload": data };
                                            node.send(msg);
                                        }
                                    });
                                }

                                if (txCharacteristic && rxCharacteristic) {
                                    node.log('Ready');
                                    node.status({ fill: "green", shape: "dot", text: "Device ready" });
                                }
                            });
                        });
                    });
                });

                peripheral.once('disconnect', function(err) {
                    node.log('Disconnected');

                    // Reset characteristics
                    txCharacteristic = null;
                    rxCharacteristic = null;

                    // Try to be connected again
                    noble.startScanning([uartServiceUuid], false);
                });
            });
        });
    }

    RED.nodes.registerType("ble uart", BleUartNode);
}
