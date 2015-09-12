/**
 * Created by Rasmus on 9/12/2015.
 */

var async = require("async");
var assert = require("chai").assert;
var expect = require("chai").expect;
require('dotenv').config({path: 'test.env'});

var SQS = require('..');

var sqsQ;

describe("Testing intialize of sqsQueue",function() {
    it("Throw err on creation with missing variables", function(done) {
        try {
            SQS.create({
                sqs: {
                    region: process.env.SQS_TEST_REGION,
                    accessKeyId: process.env.SQS_TEST_ACC_KEY,
                    //secretAccessKey: process.env.SQS_TEST_SECRET_KEY,
                    params: {
                        QueueUrl: process.env.SQS_TEST_QUEUE_URL
                    }
                },
                poll: {
                    VisibilityTimeout: 10,
                    WaitTimeSeconds: 10
                }
            })
            return done("Should have thrown error");
        } catch(error) {
            return done();
        }
    })

    it("Create sqs queue",function(done) {
        try {
            sqsQ = SQS.create({
                sqs: {
                    region: process.env.SQS_TEST_REGION,
                    accessKeyId: process.env.SQS_TEST_ACC_KEY,
                    secretAccessKey: process.env.SQS_TEST_SECRET_KEY,
                    params: {
                        QueueUrl: process.env.SQS_TEST_QUEUE_URL
                    }
                },
                poll: {
                    VisibilityTimeout: 10,
                    WaitTimeSeconds: 5
                }
            });
            return done();
        } catch(error) {
            return done(error);
        }
    })
})

describe("Put message on the sqs stack",function() {
    it("Adding message",function(done) {
        sqsQ.sendMessage({
            MessageBody : "test-message"
        },function(err,data) {
            if (err) {
                return done(err);
            } else {
                return done();
            }
        })
    })
})

describe("Get message",function() {
    var messages;
    it("Testing to get message",function(done) {
        sqsQ.on("message_received",function(err,data) {
            sqsQ.stopPolling();
            if (err) {
                done(err);
            } else {
                messages = data;
                done();
            }
        })
        sqsQ.startPolling();
    })

    it("Checking the return message",function(done) {
        var foundATestMessage = false;
        var arrMsgs = messages.Messages;
        for (var i in arrMsgs) {
            var message = arrMsgs[i];

            if (message.Body === "test-message") {
                foundATestMessage = true;
            }
        }

        if (foundATestMessage) {
            done()
        } else {
            done("Could not find the correct test message sent");
        }
    })

    it("Deleteing the test messages",function(done) {
        var arrMsgs = messages.Messages;

        async.each(arrMsgs,function(msg,cb) {
            sqsQ.deleteMessage(msg,function(err,data) {
                console.log(err);
                if (err) {
                    cb(err);
                } else {
                    cb();
                }
            })
        },function(err) {
            if (err) {
                done(err);
            } else {
                done();
            }
        })
    })
})

describe("Purgin message",function() {
    it("Adding message to purge",function(done) {
        sqsQ.sendMessage({
            MessageBody : "test-message"
        },function(err,data) {
            if (err) {
                return done(err);
            } else {
                return done();
            }
        })
    })

    it("Purgin queue",function(done) {
        sqsQ.clearQueue(function(err,data) {
            if (err) {
                done(err);
            } else {
                done();
            }
        })
    })

    it("Wait for finding message",function(done) {
        var timeoutTime = 5000;
        this.timeout(timeoutTime*2);
        sqsQ.on("message_received",function(err,data) {
            return done("Should not get any message");
        });
        sqsQ.startPolling();
        setTimeout(function(){done()}, timeoutTime);
    })
})