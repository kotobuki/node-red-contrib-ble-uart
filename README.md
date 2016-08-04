# node-red-contrib-ble-uart
A [Node-RED](http://nodered.org/) node that uses the Noble to interact with BLE devices that support the UART profile by Nordic Semiconductor

## Prerequisites

* [noble](https://github.com/sandeepmistry/noble), a Node.js BLE (Bluetooth Low Energy) central module, by Sandeep Mistry

## Install

```sh
cd $HOME/.node-red
npm install node-red-contrib-ble-uart
```

## Example

```json
[{"id":"99af4ec8.c6d5a","type":"debug","z":"70817eb5.feb8f","name":"","active":true,"console":"false","complete":"false","x":630,"y":60,"wires":[]},{"id":"dfd9a66b.1bfc78","type":"inject","z":"70817eb5.feb8f","name":"On","topic":"","payload":"On*","payloadType":"str","repeat":"","crontab":"","once":false,"x":90,"y":40,"wires":[["43a2b84.776b048"]]},{"id":"88e4011b.91e15","type":"inject","z":"70817eb5.feb8f","name":"Off","topic":"","payload":"Off*","payloadType":"str","repeat":"","crontab":"","once":false,"x":90,"y":80,"wires":[["43a2b84.776b048"]]},{"id":"6bfdc8db.8b2f78","type":"function","z":"70817eb5.feb8f","name":"To String","func":"msg.payload = String(msg.payload);\n\nreturn msg;","outputs":1,"noerr":0,"x":440,"y":60,"wires":[["99af4ec8.c6d5a"]]},{"id":"43a2b84.776b048","type":"ble uart","z":"70817eb5.feb8f","name":"","localName":"Adafruit Bluefruit LE","x":260,"y":60,"wires":[["6bfdc8db.8b2f78"]]}]
```
