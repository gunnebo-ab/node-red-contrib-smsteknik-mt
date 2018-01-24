const request = require('request');
const builder = require('xmlbuilder');
const dateFormat = require('dateformat');
const TAG = '[SMSteknikMT]';

module.exports = function (RED) {
    function SMSteknikMT(config) {
        RED.nodes.createNode(this, config);

        const node = this;

        this.on('input', function (msg) {
            node.status({});
            var data = {};
            if (config.data_source === 'payload') {
                if (msg.payload) {
                    data = msg.payload;
                } else {
                    return;
                }
            } else {
                data = {
                    Endpoint: config.url,
                    Company: config.company,
                    Username: config.username,
                    Password: config.password,
                    Number: config.number,
                    Message: config.message
                };
            }

            const now = Date.now();
            const root = builder.create('sms-teknik');
            root.ele('operationtype', 0);
            root.ele('flash', 0);
            root.ele('multisms', 0);
            root.ele('ttl', 0);
            root.ele('customid', '');
            root.ele('compresstext', 0);
            root.ele('send_date', dateFormat(now, "isoDate"));
            root.ele('send_time', dateFormat(now, "isoTime"));
            root.ele('udh', '');
            root.ele('udmessage').dat(data.Message);
            root.ele('smssender', data.Company);
            root.ele('deliverystatustype', 0);
            root.ele('deliverystatusaddress', '');
            root.ele('usereplynumber', 0);
            root.ele('usereplyforwardtype', 0);
            root.ele('usereplyforwardurl', '');
            root.ele('usereplycustomid', '');
            root.ele('usee164', 0);
            root.ele('items').ele('recipient').ele('nr', data.Number);
            const body = root.end({ pretty: true});

            const url = 'https://' + data.Endpoint + '/send/xml/' + "?id=" + data.Company.replace(/ /g, "+") + "&user=" + data.Username + "&pass=" + data.Password;
            request(
                {
                    method: 'POST',
                    uri: url,
                    headers: {
                        'Content-Type': 'text/xml'
                    },
                    body: body.toString()
                }
                , function (error, response, body) {
                    if (!error && response.statusCode === 200) {
                        node.send({payload: body});
                    } else if (error) {
                        console.log(TAG + " Error: " + error);
                        node.error(error);
                    }
                });
        });
    }

    RED.nodes.registerType("SMSteknikMT", SMSteknikMT);
};
