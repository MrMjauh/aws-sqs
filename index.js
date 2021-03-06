/**
 * Created by Rasmus on 9/12/2015.
 */
'use strict';

var async = require("async");
var AWS = require('aws-sdk');
var util = require('util');
var Hoek = require('hoek');
var EventEmitter = require('events').EventEmitter;

var internals = {
    WAIT_TIME_SECONDS : {
        MAX : 20,
        MIN : 1
    },
    VISIBILITY_TIMEOUT : {
        DEF_VAlUE : 15
    }
};

function SqsHelper(options, sqsInstance) {
    Hoek.assert(options !== undefined, new Error("options parameters should be passed"));
    // sqs queue properties
    if (!sqsInstance) {
        Hoek.assert(options.aws !== undefined, new Error("options.aws parameters should be passed"));
        Hoek.assert(options.aws.region !== undefined, new Error("Missing options.aws.region"));
        Hoek.assert(options.aws.accessKeyId !== undefined, new Error("Missing options.aws.accessKeyId"));
        Hoek.assert(options.aws.secretAccessKey !== undefined, new Error("Missing options.aws.secretAccessKey"));
        Hoek.assert(options.aws.params.QueueUrl !== undefined, new Error("Missing options.aws.params.QueueUrl"));
    }

    // Check polling options
    if (options.poll === undefined) {
        options.poll = {
            VisibilityTimeout: internals.VISIBILITY_TIMEOUT.DEF_VAlUE,
            WaitTimeSeconds: internals.WAIT_TIME_SECONDS.MAX
        };
    } else {
        options.poll.WaitTimeSeconds =   options.poll.WaitTimeSeconds || 10;
        options.poll.VisibilityTimeout = options.poll.VisibilityTimeout || internals.VISIBILITY_TIMEOUT.DEF_VAlUE;
    }

    this.reciveAttributes = options.reciveAttributes || {};

    this.options = options;
    this.shouldPoll = false;

    // create new sqs from the options
    this._sqs = sqsInstance || new AWS.SQS(options.aws);
    EventEmitter.call(this);
}

// Inherit functions from `EventEmitter`'s prototype
// ORDER IS SUPER IMPORTANT FUCKING SHIT STUFF
util.inherits(SqsHelper, EventEmitter);

SqsHelper.create = function (options) {
    return new SqsHelper(options);
}

SqsHelper.prototype.startPolling = function (reciveAttributes) {
    if (reciveAttributes !== undefined) {
        this.reciveAttributes = reciveAttributes;
    }

    var self = this;
    self.shouldPoll = true;

    async.whilst(
        function () {
            return self.shouldPoll
        },
        function (callback) {
            self._poll(function () {
                setTimeout(callback, 0);
            });
        },
        function (err) {

        }
    )
};

SqsHelper.prototype.deleteMessage = function(receiptHandleId,cb) {
    this._sqs.deleteMessage({ReceiptHandle : receiptHandleId}, function (err, data) {
        if (err) {
            return cb(err,null);
        } else {
            return cb(null,data);
        }
    })
}

SqsHelper.prototype.stopPolling = function () {
    this.shouldPoll = false;
};

SqsHelper.prototype._poll = function (cb) {
    var self = this;
    this._sqs.receiveMessage({
        MessageAttributeNames :  this.reciveAttributes,
        VisibilityTimeout : this.options.poll.VisibilityTimeout,
        WaitTimeSeconds : this.options.poll.WaitTimeSeconds
    }, function (err, data) {
        var msgJson = {};
        if (err) {
            self.emit('message_received', err,null);
        } else {
            self.emit('message_received', null,data);
        }

        return cb();
    })
};

SqsHelper.prototype.sendMessage = function (messageParams, cb) {
    this._sqs.sendMessage(messageParams, function (err, data) {
        return cb(err, data);
    })
};

SqsHelper.prototype.clearQueue = function (cb) {
    this._sqs.purgeQueue(function(err,data) {
        if (err) {
            return cb(err,null);
        } else {
            return cb(null,data);
        }
    })
}

module.exports = SqsHelper;
