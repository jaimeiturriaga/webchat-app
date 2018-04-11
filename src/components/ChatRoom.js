import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import {Tweet} from 'react-twitter-widgets'

class ChatWindow extends Component {
    constructor(props){
        super(props);
        this.state = {
            totalMessages: new Array(),
        }

        this.props.socket.on("server:message",(msg) => {
            var d = new Date();
            const newMessages = this.state.totalMessages.slice();
            newMessages.push({
                message:msg,
                date: d.getTime(),
                isTweet: false,
            });
            this.setState({
                totalMessages:newMessages
            });
        });
        this.props.socket.on("server:tweet",(tweetId) => {
            var d = new Date();
            const newTweet = this.state.totalMessages.slice();
            newTweet.push({
                message:tweetId,
                date: d.getTime(),
                isTweet: true,
            });
            this.setState({
                totalMessages:newTweet
            });
        });
    }


    renderMessages(){
        return(
        <div>
            <ul>
            {
                this.state.totalMessages.map((log) => {
                    var date = log.date;
                    var message = log.message;
                    if(log.isTweet==false)
                        return (
                            <li key={date}>{message}</li>
                        )
                    else{
                        return (
                            <li key={date}>
                            <Tweet
                                tweetId={message}
                            />
                            </li>
                        )
                    }
                })
            }
            </ul>
        </div>
        )
    }
    render() {
        return (
            <div>
                <h1> Chat Room: {this.props.currentRoom} </h1>
                <div classname="message-box">
                {this.renderMessages()}
                </div>
            </div>
        )
    }
}

class ChatBox extends Component{
    constructor(props){
        super(props);
        this.state={
            messageForm: "",
        }
    }

    _messageFormHandler(event){
        this.setState({messageForm:event.target.value});
    }

    _sendMessage(e){
        e.preventDefault();
        if(this.props.currentRoom == null){
            alert("You must join a room before you can start chatting");
            return;
        }
        this.props.socket.emit("client:message",this.state.messageForm);
        this.setState({messageForm:""});
    }

    render(){
        return (
            <div>
                <form action="" id="messageBox" onSubmit={this._sendMessage.bind(this)}>
                    <input
                    value={this.state.messageForm}
                    onChange={this._messageFormHandler.bind(this)}
                    autocomplete="off"
                    />
                    <button type="button" onClick={this._sendMessage.bind(this)}>Send</button>
                </form>
            </div>
        )
    }
}


export { ChatBox, ChatWindow };
