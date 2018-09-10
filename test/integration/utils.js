'use strict';

const hostile = require('hostile');
const http = require('http');

const server = ({ failAt = 3, healAt = 10, type = 'code-500' } = {}) => {
    return new Promise((resolve) => {
        let counter = 0;
        const s = http.createServer((req, res) => {
            counter += 1;
            if (counter >= failAt && counter <= healAt) {
                if (type === 'code-400') {
                    res.writeHead(400, { 'Content-Type': 'text/plain' });
                    res.end('error');
                }
                if (type === 'code-500') {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('error');
                }
                if (type === 'timeout') {
                    setTimeout(() => {
                        res.writeHead(200, { 'Content-Type': 'text/plain' });
                        res.end('ok');
                    }, 1000);
                }
                return;
            }

            res.writeHead(200, { 'Content-Type': 'text/plain' });
            res.end('ok');
        }).listen({ host: '127.0.0.1', port: 0 }, () => {
            resolve(s);
        });
    });
};
module.exports.server = server;


const request = (options) => {
    return new Promise((resolve) => {
        const req = http.get(options);

        req.on('response', (res) => {
            if (res.statusCode !== 200) {
                resolve('http error');
            }

            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                resolve(data);
            });
        });

        req.on('error', (error) => {
            if (error.name === 'CircuitBreakerOpenException') {
                resolve('circuit breaking');
            } else {
                resolve('error');
            }
        });

        req.on('timeout', () => {
            resolve('timeout');
            req.destroy();
        });
    });
};
module.exports.request = request;


const sleep = (time) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};
module.exports.sleep = sleep;


const before = () => {
    return new Promise((resolve, reject) => {
        hostile.set('127.0.0.1', 'circuit-b.local', (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
};
module.exports.before = before;


const after = () => {
    return new Promise((resolve, reject) => {
        hostile.remove('127.0.0.1', 'circuit-b.local', (error) => {
            if (error) {
                reject(error);
                return;
            }
            resolve();
        });
    });
};
module.exports.after = after;
