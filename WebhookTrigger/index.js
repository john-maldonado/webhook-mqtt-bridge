// Require MQTT
const mqtt = require('mqtt');

// Define azure function
module.exports = function (context, req) {
    // Log function start
    context.log('JavaScript HTTP trigger function processed a request.');

    // Get secrets from environment variables
    const mqttURL = process.env["MQTT_URL"];
    const mqttPort = parseInt(process.env["MQTT_PORT"]);
    const mqttUname = process.env["MQTT_UNAME"];
    const mqttPword = process.env["MQTT_PWORD"];
    const mqttClientID = process.env["MQTT_CLIENTID"];

    // Connect to MQTT Broker
    const client = mqtt.connect(mqttURL, {
        port: mqttPort,
        username: mqttUname,
        password: mqttPword,
        rejectUnauthorized: false,
        clientId: mqttClientID
    });

    // Define once connect callback
    client.once('connect', function () {
        // Log sucessful connection
        context.log('MQTT connected');

        // Define base namespace for app metrics topics
        const appNamespace = 'flat-mqtt/azure/webhook-bridge/';

        // Publish some metrics about the function execution
        const bridgeTimestamp = Date.now();
        const source = req.headers['source'];
        client.publish(appNamespace + 'timestamp', JSON.stringify(bridgeTimestamp), {retain:true});
        client.publish(appNamespace + 'source', JSON.stringify(source), {retain:true});

        // Define pass variable to keep track of if the message is handled
        let pass;

        if (source == "iMonnit") {
            // If source is iMonnit
            pass = true;
            context.log('Source: iMonnit');
            
            // Get request body
            const payload = req.body;

            // Define namespace for message topics
            const sourceNamespace = 'flat-mqtt/iMonnit/'

            // Check if there is a gateway message
            if ('gatewayMessage' in payload) {

                const gatewayMessage = payload.gatewayMessage;
                //context.log('Gateway Message: ' + JSON.stringify(gatewayMessage));
                const gatewayNamespace = sourceNamespace + gatewayMessage.gatewayName + '/';

                const props = [
                    "gatewayID",
                    "gatewayName",
                    "accountID",
                    "networkID",
                    "messageType",
                    "power",
                    "batteryLevel",
                    "date",
                    "count",
                    "signalStrength",
                    "pendingChange"
                ];
                
                // Publish Gateway messages
                props.forEach(prop => {
                    const metricName = prop;
                    const metricValue = gatewayMessage[prop];
                    const metricTopic = gatewayNamespace + metricName;
                    client.publish(metricTopic, JSON.stringify(metricValue), {retain:true});    
                });
            };

            // Check if there is a sensor message
            if ('sensorMessages' in payload) {
                const sensorMessages = payload.sensorMessages;
                //context.log('Sensor Messages: ' + JSON.stringify(sensorMessages));

                const props = [
                    "sensorName",
                    "applicationID",
                    "networkID",
                    "dataMessageGUID",
                    "state",
                    "messageDate",
                    "rawData",
                    "dataType",
                    "dataValue",
                    "plotValues",
                    "plotLabels",
                    "batteryLevel",
                    "signalStrength",
                    "pendingChange",
                    "voltage"
                ];

                // Publish sensor messages
                sensorMessages.forEach(sensorMessage => {
                    //context.log(JSON.stringify(sensorMessage));
                    const sensorNamespace = sourceNamespace + sensorMessage.sensorName + '/';
                    props.forEach(prop => {
                        const metricName = prop;
                        const metricValue = sensorMessage[prop];
                        const metricTopic = sensorNamespace + metricName;
                        client.publish(metricTopic, JSON.stringify(metricValue), {retain:true});
                    });
                });
            };
        } else {
            // If the source is unhandled
            context.log('Source: Unhandled');
            pass = false;
        }

        // create response message
        const responseMessage = "Request Processed: " + pass + " Source: " + source;

        // Pass reponse to context
        context.res = {
            // status: 200
            body: responseMessage
        };
        
        // End MQTT Client
        client.end();

        // End Function
        context.done();
    });
}