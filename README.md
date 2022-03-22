# webhook-mqtt-bridge
 A node.js Azure Function App that recieves data from a webhook and publishes to an MQTT broker

## How to use this repo
This repo contains an Azure function app that can be deployed straight to azure. This function can be ran on a free account assuming the traffic is kept below the azure free grant. If you want to try this yourself I suggest forking the code, rewriting the JSON parsing to handle whatever incoming HTTP request you have in your use case. You can deploy your forked repo to Azure via the configuration center.
<br>
Some things to note when setting up the Azure function:
### Creation Process
- Login to Azure Portal
- Click Create Resource
- Search for Function App
- Click on Function App
- Choose Function App under Plan
- Click Create
### Basics
- Choose Subscription
- Choose or create resource group
- Function App name ➝ "your-func-name-here"
- Choose Runtime ➝ Node JS
- Version ➝ 14 LTS
-  Region ➝ Choose your region
### Hosting
- Operating System ➝ Windows
- Plan ➝ Consumption

## How it works
An Azure function app needs to first be created via the Azure portal or Azure CLI. The function is configured to trigger when an HTTP request is made to the function URL. Once triggered, the code in index.js is executed.

### MQTT Connection
The MQTT connection parameters should be stored in environment variables to keep your credentials secret.
```js const client = mqtt.connect()``` Connects to the broker and creates a client object <br>
```js client.once('connect', function () {};``` Defines the call back function that runs once the client successfully connects to the broker <br>
In this case we only need to connect to broker once, and once we have connected we are ready to publish our webhook data <br>
### Publishing
```js client.publish(metricTopic, JSON.stringify(metricValue), {retain:true});``` Publishes each message to the broker under the desired topic. We also set the retain flag to true, since there is a good chance that a new client that needs the data will connect before our function triggers again.
### Ending the function
After all the data has been published ```js client.end();``` Closes the MQTT connection.
```js context.done();``` lets Azure know that our function is done executing.
