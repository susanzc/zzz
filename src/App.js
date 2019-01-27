import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, Modal, ModalHeader, ModalFooter, ModalBody, ListGroup, ListGroupItem } from 'reactstrap';
import TimePicker from 'rc-time-picker';
import moment from 'moment';

import 'rc-time-picker/assets/index.css';

var SpotifyWebApi = require('spotify-web-api-node');

const url = process.env.REACT_APP_URL;
const getUrl = "https://accounts.spotify.com/authorize/?client_id=" + process.env.REACT_APP_CLIENT_ID
  + "&response_type=token&redirect_uri=" + url + "&scope=user-read-private%20user-top-read%20user-read-email&state=34fFs29kd09";
const spotifyApi = new SpotifyWebApi({
  clientId: process.env.REACT_APP_CLIENT_ID,
  clientSecret: process.env.REACT_APP_CLIENT_SECRET,
  redirectUri: url
});

class App extends Component {
  constructor(props) {
    super(props);
    this.state = { token: "", 
    user: "", 
    modalOpen: false, 
    activeAlarms: [], 
    playlists: [],
    time: null,
    selectedPl: null}
    this.loadUser = this.loadUser.bind(this);
    this.authenticationComplete = this.authenticationComplete.bind(this);
    this.tokenSaved = this.tokenSaved.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.onChangeTime = this.onChangeTime.bind(this);
    this.addAlarm = this.addAlarm.bind(this);
    this.setActivePl = this.setActivePl.bind(this);
    this.renderPlaylists = this.renderPlaylists.bind(this);
    this.addAlarm = this.addAlarm.bind(this);
  }

  componentDidMount() {
    var token = "";
    if (!this.authenticationComplete()) {
      window.location.replace(getUrl);
    }
    else if (!this.tokenSaved()) {
      token = window.location.href.split("=")[1].split("&")[0];
      sessionStorage.setItem("token", token);
      window.location.replace(url + "/index.html?success=true")
    }
    else {
      token = sessionStorage.getItem("token");
      spotifyApi.setAccessToken(token);
      this.setState({token: token});
      this.loadUser();
      this.loadPlaylists();
    }
  }

  authenticationComplete() {
    return (window.location.href.includes("access_token") || this.tokenSaved());
  }

  tokenSaved() {
    return window.location.href.includes("success") && sessionStorage.getItem("token");
  }

  toggleModal() {
    this.setState({modalOpen: !this.state.modalOpen, selectedPl: null})
  }

  onChangeTime(time) {
    this.setState({time: time});
  }

  addAlarm() {
    if (this.state.time != null) {
      // add time
      // link alarm action
    }
    else {
      //todo: error message
    }
  }

  loadUser() {
    let that = this;
    spotifyApi.getMe()
      .then(function (data) {
        let imageUrl = "";
        that.setState({ user: data.body.display_name, })
      }, function (err) {
        console.log('Something went wrong!', err); // token may have expired
        window.location.replace(getUrl);
      });
  }

  setActivePl(pl) {
    this.setState({selectedPl: pl})
    console.log(pl);
  }

  loadPlaylists() {
    let that = this;
    spotifyApi.getUserPlaylists()
      .then(function (data) {
        console.log(data);
        that.setState({playlists: data.body.items});
    }
      )
  }
  
  addAlarm() {
    // todo;
    // create and add to active alarms
    // alarm format:
    // 07:00 AM    Cancel Edit
    let alarm = {time: this.state.time, pId: this.state.selectedPl};
    let alarms = this.state.activeAlarms;
    alarms.push(alarm);
    //alarms = alarms.sort((a, b) => a.time < b.time);
    this.setState({activeAlarms: alarms});
    this.toggleModal();
  }

  renderAlarms() {
    let alarms = [];
    this.state.activeAlarms.map((alarm, i) => {
      console.log(alarm.time)
    alarms.push(
    <ListGroupItem>
      <div>{alarm.time._d.toString()}</div>

    </ListGroupItem>)
    });
    return alarms;
  }

  renderPlaylists() {
    let playlists = [];
    this.state.playlists.map((pl, i) => {
      let active = this.state.selectedPl == pl.id? 'darkgray' : 'whitesmoke';
      playlists.push(<ListGroupItem 
        onClick={() => this.setActivePl(pl.id)}
      style={{padding: 5, backgroundColor: active}}>
        <div style={{display: 'flex'}}>
        <img src={pl.images[0].url} height={32} width={32}/>
        <div style={{margin: 5}}>{pl.name}</div>
        </div>
      </ListGroupItem>);
    }
  )
  return playlists;
  }

  render() {
    return (
      <div className="App">
        <div style={{float: 'right', margin: 20}}>Hi, {(this.state.user).split(" ")[0]}</div>
        <br/>
        <div style={{marginTop: 50, color: "grey"}}>
         {this.state.activeAlarms.length == 0? "No Alarms" : 
         <ListGroup>{this.renderAlarms()}</ListGroup>}
        </div><div style={{right: 50, position: 'absolute', bottom: 50}}>
        <Button size="lg" color="primary" onClick={this.toggleModal}>+ Add Alarm</Button>
        </div>
        
        <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>Add Alarm</ModalHeader>
          <ModalBody>
          <TimePicker
            showSecond={false}
            defaultValue={moment().hour(0).minute(0)}
            onChange={this.onChangeTime}
            format={'h:mm a'}
            use12Hours
            inputReadOnly
          />
          <div style={{marginTop: 20, marginBottom: 20}}>Select Playlist:</div>
          <div style={{height: 200, overflow: 'scroll'}}>
              <ListGroup>
              {this.renderPlaylists()}
              </ListGroup>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" disabled={this.state.time == null || this.state.selectedPl == null} 
            onClick={this.addAlarm}>Add</Button>{' '}
            <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default App;
