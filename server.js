var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    Twitter = require('twitter-node-client').Twitter;

var roomList = new Array();
var userList = new Array();
var twitter = new Twitter({
    "consumerKey": "rylWLTRsPPNX2cX3UwUbz419d",
    "consumerSecret": "QOXVf4JPJZd3fyxoBxbgtu4nhAZI0K63BO0alRIkR4ojS2lnHN",
    "accessToken": "3167021495-9dlEj0NWTNw27zcxBG2atPO8JjO8whlyDvAZ9sE",
    "accessTokenSecret": "tuJ4DaSCFndaXbJgSXi7vVwuqjlUAXhh5ZtYEQB4O64uc",
    "callBackUrl": "XXX"
});
//array of all tweet ids in a message
var tweets = new Array();
var tempLocalRoomName;

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(__dirname));

var error = function(err,response,body) {
    console.log(err);
    io.to(tempLocalRoomName).emit('server:message','Could not find tweet, try again later');
}

var success = function(data){
    if(JSON.parse(data).statuses.length !== 0){
        io.to(tempLocalRoomName).emit('server:tweet',JSON.parse(data).statuses[0].id_str);
    } else {
        console.log("Error, couldn't find tweet");
        console.log(data);
        io.to(tempLocalRoomName).emit('server:message','Could not find tweet, try again later');
    }
}

function findUser(name){
    if(userList !== null)
        for(var i=0; i<userList.length; i++){
            if(userList[i].userName === name){
                return i;
            }
        }
    return -1;
}

function findSocket(socketId){
    if(userList !== null)
        for (var i=0; i<userList.length; i++){
            if(userList[i].socketId === socketId){
                return i;
            }
        }
    return -1;
}

function findRoom(name){
    if(roomList !== null)
        for(var i=0; i<roomList.length; i++){
            if(roomList[i].roomName === name){
                return i;
            }
        }
    return -1;
}

//remove user from usersInRoom array from their room
function leaveRoom(localRoomName,socketId){
    //find room in question
    var roomIndex = findRoom(localRoomName);
    //find entry for this user in room's usersInRoom array
    var userIndex = roomList[roomIndex].usersInRoom.indexOf(socketId);
    //remove user from usersInRoom
    roomList[roomIndex].usersInRoom.splice(userIndex,1);
    //if usersInRoom is now empty, delete this room
    if(roomList[roomIndex].usersInRoom.length == 0){
        //delete this room
        roomList.splice(roomIndex,1);
    }
    //Note: This function does not change which room the user is assigned to by socket
    //Make sure that after this function runs, you either change the room allocation
    //or drop the user if disconnecting
}

function parseTweet(message){
    //first erase old array
    tweets.splice(0,tweets.length);
    //copy over message just to be safe
    var msg = message.slice();
    var tweet;
    var indexOfHash;
    //parse #
    while((indexOfHash = msg.indexOf("#")) !== -1){
        //delete everything up to hash
        msg = msg.slice(indexOfHash,msg.length);
        //split at a space
        tweet = msg.split(" ",1);
        //check if there was space in front of #
        if(tweet !== "#") {
            //push result
            tweets.push(tweet);
        }
        //remove hashtag from msg and keep searching
        msg = msg.slice(1,msg.length);
    }
    console.log(tweets);
    return (tweets.length);
}

function twitterHandle(hashtag,errFunc,succFunc){
    twitter.getSearch({
        'q':hashtag,
        'count':1,
        'result\_type':'recent',
    },errFunc,succFunc);
}

//Socket.io looking for connection
io.on('connection', function(socket){
    var localRoomName = null;
    var localUserName = null;
    console.log("A user has connected!");
    socket.emit('client:newUser');

    //Event fires when clientside has asked to use name
    socket.on('server:newUser',function(name){
        /* commented out to allow for repeating names
        //check and see if name is taken
        if(findUser(name) !== -1){
            //name taken
            socket.emit('client:nameTaken');
        } else */{
            //add name to list of users
            userList.push({
                userName:name,
                socketId:socket.id,
            });
            localUserName = name;
            console.log(name + " has joined the chat server");
            console.log("Total members");
            for (var i=0; i<userList.length;i++){
                console.log(userList[i].userName);
            }
        }
    });

    //Fires when client asks to join room
    socket.on('client:join', function(room){
        // Join the room.
        var index = findRoom(room);
        if(index === -1){
            //error room doesn't exist
            console.log('Error: Room doesn\'t exist');
        } else {
            if(localRoomName !== null){
                //User was in another room before. Remove them and change socket allocation
                leaveRoom(localRoomName,socket.id);
                socket.leave(localRoomName);
            }
            //join existing room
            roomList[index].usersInRoom.push(socket.id);
            localRoomName = room;
            socket.join(room);
        }
    })

    //Fires when client requests to make a new room
    socket.on('client:newRoom', function(room){
        //check if room already exists
        var index = findRoom(room);
        if(index === -1){
            //room does not exist, make new room
            if(localRoomName !== null){
                //user was in another room before, remove them and change socket allocation
                leaveRoom(localRoomName,socket.id);
                socket.leave(localRoomName);
            }
            roomList.push({
                roomName:room,
                usersInRoom: new Array(),
            });
            roomList[roomList.length-1].usersInRoom.push(socket.id);
            localRoomName = room;
            socket.join(room);
        } else {
            //room already exists, send a message
            socket.emit('client:errRoomExist');
        }
    })

    //fires when client requests a list of all rooms (every second)
    socket.on('client:rooms', function(){
        // Send back all existing rooms.
        io.emit('server:rooms',roomList);
    })

    //broadcast a message to all members in localRoomName
    socket.on("client:message", function(message){
        if(localRoomName == null){
            //user not in a room, send Error
            socket.emit("client:messageErrNotInRoom");
        } else {
            //send message via io.to
            io.to(localRoomName).emit("server:message",localUserName + ": " + message);
            //parse message for hashtags
            if(parseTweet(message) !== 0){
                tempLocalRoomName = localRoomName;
                for(var i=0;i<tweets.length;i++){
                    var hashtag = tweets[i];
                    setTimeout(twitterHandle,100*i,hashtag,error,success);
                }
            }
        }
    })

    socket.on('disconnect', function() {
        //Disconnect
        var socketIndex = findSocket(socket.id);
        if(socketIndex == -1){
            //user was not listed. Did not choose name
            console.log("Unknown user has disconnected");
            return;
        }
        //print out which user disconnected
        console.log(userList[socketIndex].userName + " has disconnected!");
        //check if user is in a chatroom
        if(localRoomName !== null){
            //remove user from chatRoom's usersInRoom
            leaveRoom(localRoomName,userList[socketIndex].userName);
            socket.leave(localRoomName);
        }
        //remove user from userList
        userList.splice(socketIndex,1);
        //print out remaining users
        console.log("Total members (" + userList.length + ")");
        for (var i=0; i<userList.length;i++){
            console.log(userList[i].userName);
        }
    });
});

server.listen(3000, function(){
    console.log("Server running on port 3000.")
});
