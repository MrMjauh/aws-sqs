# Simple SQS wrapper for Node.js
Simple SQS wrapper used for recieving and sending message over the SQS queue in Node.js.



    var SqsWrapper = require('aws-sqs-wrapper');

    var sqsQueue = SqsWrapper.create({
                    aws: {
                        region: "region",
                        accessKeyId: "accKey",
                        secretAccessKey: "secret",
                        params: {
                            QueueUrl: "url"
                        }
                    },
                    poll: {
                        VisibilityTimeout: 10,
                        WaitTimeSeconds: 10
                    }
    });
    
    sqsQueue.on("message_received",function(err,data) {
        // handle recieved message from the queue
        handle(data);
        
        // delete the messsage from the sqs queue
        sqsQueue.delete(data.Messages[0],function(err,succ))
    });
    
    // start long polling for data on the queuee
    sqsQueue.startPolling();
    
    // send some data to the queue
    sqsQueue.sendMessage({MessageBody : "Some cool msgs"},function(err,succ) {
        // handle callback
    })
    
    
