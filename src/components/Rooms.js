import React, { Component } from 'react'
import openSocket from 'socket.io-client'

class Rooms extends Component {
    constructor(props) {
        super(props)
        this.state = {
            rooms: new Array(),
            newRoomName: null,
        };

        // A bit of sample socket.io code. Open a websocket.
        //this.socket = openSocket('http://localhost:3000')
        // Wait for server to update the rooms.
        this.props.socket.on('server:rooms', list => {
            // Handle rooms changes here.
            this.setState({
                rooms:list,
            });
        });

        this.props.socket.on('client:errRoomExist', () => {
            //the room we tried to make already exists
            //use another name
            this.props.restorePrevRoom();
            alert('Name is taken. Please try another name');
        });
    }

    componentDidMount() {
        setInterval(() => {
            // Get existing rooms every second.
            this.props.socket.emit('client:rooms');
        }, 100)
    }

    _makeRoom(e){
        e.preventDefault();
        //check if string is empty or null
        if(this.state.newRoomName == null || this.state.newRoomName == ''){
            return;
        }
        this.props.socket.emit('client:newRoom',this.state.newRoomName);
        this.props.currentRoomHandler(this.state.newRoomName);
        this.setState({newRoomName: ''});
    }

    _onNewRoomChange(event){
        this.setState({newRoomName: event.target.value});
    }

    _joinRoomHandler(roomName){
        this.props.currentRoomHandler(roomName);
        this.props.socket.emit('client:join',roomName);
    }

    renderNewRoomForm(){
        return(
            <div>
            <h3>Create new Room</h3>
            <form action="" id="newRoomForm" onSubmit={this._makeRoom.bind(this)}>
              <input
                value={this.state.newRoomName}
                onChange={this._onNewRoomChange.bind(this)}
                autoComplete="off"
                />

            </form>
            <button type="button" onClick={this._makeRoom.bind(this)}>Create New Room</button>
            <h4> Username: <br/>{this.props.username}</h4>
            </div>
        )
    }

    render() {
        if(this.state.rooms.length !== 0)
            return (
            <div>
                    <div className="room-list">
                    <h3> Open Rooms </h3>
                    <ul>
                        {
                            //lists all rooms in the room structure
                            this.state.rooms.map((room) =>{
                                var roomName = room.roomName.slice();
                                if(roomName !== this.props.currentRoom)
                                return(
                                    <li key={roomName}>
                                        <button
                                        type="button"
                                        onClick={() => this._joinRoomHandler(roomName).bind(this)}
                                        >{roomName}</button>
                                    </li>
                                )
                                else return <li key={roomName}>{roomName}</li>
                            })
                        }
                    </ul>
                    </div>
                    <div className="new-room">
                    {this.renderNewRoomForm()}
                    </div>
            </div>
        )
        else {
            return(
            <div>
                <div className="room-list">
                    <h3> No Rooms </h3>
                </div>
                <div className="new-room">
                    {this.renderNewRoomForm()}
                </div>
            </div>
            )
        }
    }
}

export default Rooms
