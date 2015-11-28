'use strict';

var Hapi = require('hapi');
var Path = require('path');
var Inert = require('inert');
var fs = require('fs');

var uniqueImageNumber = 0;

const server = new Hapi.Server();
server.register(Inert, init);

function init () {

    var handlers = {};

    handlers.getLatest = function(request, reply) {
        var FFI = require("ffi");
        var libc = new FFI.Library(null, {
          "system": ["int32", ["string"]]
        });

        libc.system("bin/kerrSlice < config.json");
        
        uniqueImageNumber++;
        var uniqueImage='images/image'+uniqueImageNumber+'.png';
        libc.system("mv images/lastimage.png "+uniqueImage);
        
        var myreply =
        {
            newtime: uniqueImageNumber,
            imagefile: uniqueImage
        };
        reply(myreply);

        console.log(myreply);
    };

    handlers.restart = function(request, reply) {
        fs.unlink("./continue.dat");

        var myreply =
        {
            restart: true
        };
        reply(myreply);

        console.log(myreply);
    };

    handlers.postConfig = function(req, reply) {
        var configObject = {
                "chi" : req.payload.chi,
                "sigma" : req.payload.sigma,
                "Intensity" : req.payload.Intensity,
                "Reflectivity" : req.payload.Reflectivity,
                "ngp" : req.payload.ngp,
                "domainwidth" : req.payload.domainwidth,
                "dt" : req.payload.dt,
                "InitialCarrierDensity" : req.payload.InitialCarrierDensity,
                "initialNoise" : req.payload.initialNoise,
                "additiveNoise" : req.payload.additiveNoise,
                "IntegrationTime" : req.payload.IntegrationTime,
                "WriteTime" : req.payload.WriteTime,
                "FinalImage" : req.payload.FinalImage };

        console.log('Received: ');
        console.log(configObject);

        var outputFilename = './config.json';
        fs.writeFile(outputFilename, JSON.stringify(configObject), function(err) {
            if(err) {
              console.log(err);
            } else {
              console.log("JSON saved to "+outputFilename);
            }
        }); 

        reply(configObject);
    };

    handlers.root = function( request, reply) {
            reply.file('./index.html');
    }
    
    handlers.imageIFrame = function( request, reply) {
            reply.file('./image.html');
    }
    
    handlers.images = { directory: { path: './images', listing: false, index: true } };

    var routes =
    [
      { method: 'GET', path: '/', handler: handlers.root },
      { method: 'GET', path: '/apiV1/simulations/get', handler: handlers.getLatest },
      { method:'POST', path: '/apiV1/simulations/post', handler: handlers.postConfig },
      { method: 'GET', path: '/apiV1/simulations/restart', handler: handlers.restart },
      { method: 'GET', path: '/images/{path*}', handler: handlers.images }
    ];

    server.connection({ host: 'localhost', port: 3000 });
    server.route( routes );
    server.start((err) => {
        if (err) {
            throw err;
        }
        console.log('Server running at:', server.info.uri);
    });
}

