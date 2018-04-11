import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {ChatWindow} from './ChatRoom.js'
import {ChatBox} from './ChatRoom.js'
import Rooms from './Rooms.js'
import openSocket from 'socket.io-client'

export default class App extends Component {

    constructor(props){
        super(props);
        this.state = {
            username: null,
            currentRoom: null,
            prevRoom: null,
        };
        // A bit of sample socket.io code. Open a websocket.
        this.socket = openSocket(location.hostname + ":3000");

        //fires when connection is succesful
        this.socket.on('client:newUser', () => {
            do{
                var name = prompt("Please enter your username");
                if(name == null || name == ""){
                    //didn't enter username, prompt again
                } else {
                    //set username, ask server to check if taken
                    this.setState({
                        username:name,
                    });
                    this.socket.emit('server:newUser',name);
                }
            } while (name == null || name == "");
        });
        //fires when username is already taken
        this.socket.on('client:nameTaken', () => {
            do{
                var name = prompt("Name taken, please try another name");
                if(name == null || name == ""){
                    //didn't enter username, prompt again
                } else {
                    //set username, ask server to check if taken
                    this.setState({
                        username:name,
                    });
                    this.socket.emit('server:newUser',name);
                }
            } while (name == null || name == "");
        });

    }

    currentRoomHandler (room){
        this.setState({
            prevRoom: this.state.currentRoom,
            currentRoom: room,
        });
    };

    restorePrevRoom (){
        this.setState({
            currentRoom: this.state.prevRoom,
            prevRom: null,
        })
    }

    render(){
        return (
            <div>
                <div className='rowC'>
                    <div className="room-tab">
                        <Rooms
                        username={this.state.username}
                        currentRoom={this.state.currentRoom}
                        socket={this.socket}
                        currentRoomHandler = {this.currentRoomHandler.bind(this)}
                        restorePrevRoom = {this.restorePrevRoom.bind(this)}
                        />
                    </div>
                    <div className="chat-tab">
                        <ChatWindow
                        currentRoom={this.state.currentRoom}
                        socket={this.socket}
                        />
                    </div>
                </div>
                <div className="chat-box">
                    <ChatBox
                    currentRoom={this.state.currentRoom}
                    socket={this.socket}
                    />
                </div>
            </div>
        )
    }
}

ReactDOM.render(<App />, document.getElementById('app'));
