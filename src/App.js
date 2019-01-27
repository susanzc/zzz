import React, { Component } from 'react';
import './App.css';
import { Button, Modal, Input, ModalHeader, ModalFooter, ModalBody, ListGroup, ListGroupItem } from 'reactstrap';
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
    selectedPl: null,
    displayText: [],
    audio: null}
    this.loadUser = this.loadUser.bind(this);
    this.authenticationComplete = this.authenticationComplete.bind(this);
    this.tokenSaved = this.tokenSaved.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.onChangeTime = this.onChangeTime.bind(this);
    this.addAlarm = this.addAlarm.bind(this);
    this.setActivePl = this.setActivePl.bind(this);
    this.renderPlaylists = this.renderPlaylists.bind(this);
    this.removeAlarm = this.removeAlarm.bind(this);
    this.checkAlarms = this.checkAlarms.bind(this);
    this.checkTrack = this.checkTrack.bind(this);
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
      this.interval = setInterval(
        () => this.checkAlarms(),
      1000)
    
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  authenticationComplete() {
    return (window.location.href.includes("access_token") || this.tokenSaved());
  }

  removeAlarm(alarm) {
    let alarms = this.state.activeAlarms;
    let ind = alarms.indexOf(alarm);
    alarms.splice(ind, 1);
    this.setState({activeAlarms: alarms});

  }

  tokenSaved() {
    return window.location.href.includes("success") && sessionStorage.getItem("token");
  }

  toggleModal() {
    this.setState({modalOpen: !this.state.modalOpen, selectedPl: null})
  }

  onChangeTime(time) {
    time._d.setSeconds(0);
    this.setState({time: time});
  }

  checkTrack(event) {
    let track = event.target.value;
    let toCheck = track.toUpperCase();

    let display = [];
    let correct = this.state.track;
    for (let i in track) {
      let color = 'red';
      if (track.toUpperCase().charAt(i) == correct.charAt(i)) {
        color = 'green';
      }
      display.push(<span style={{color: color}}>{track.charAt(i)}</span>);
    }
    this.setState({displayText: display});
    if (toCheck == this.state.track) {
      let audio = this.state.audio;
      audio.pause();
      this.setState({track: null, audio: null, enteredText: track});
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
  }

  loadPlaylists() {
    let that = this;
    spotifyApi.getUserPlaylists()
      .then(function (data) {
        that.setState({playlists: data.body.items});
    }
      )
  }
  
  addAlarm() {
    let alarm = {time: this.state.time, pl: this.state.selectedPl};
    let alarms = this.state.activeAlarms;
    alarms.push(alarm);
    alarms.sort((a, b) => a.time.isAfter(b.time) ? 1 : -1);
    this.setState({activeAlarms: alarms});
    this.toggleModal();
  }


  checkAlarms(){
    let activeAlarms = this.state.activeAlarms;
    let newAlarms = [];
    let that = this;
    for (let i = 0; i < activeAlarms.length; i++) {
      let alarm = activeAlarms[i];
      if (moment().isSameOrAfter(alarm.time)) {
        spotifyApi.getPlaylist(alarm.pl.id)
        .then(function(data) {
          let tracks = data.body.tracks.items;
          let track = tracks[Math.floor(Math.random()*tracks.length)].track;
          while (track == null) {
            track = tracks[Math.floor(Math.random()*tracks.length)].track;
          }
          let audio = new Audio(track.preview_url);
          audio.play();
          let ind = track.name.indexOf('(');
          if (ind > 0) {
            track = track.name.substring(0, track.name.indexOf('(')).trim();
          }
          that.setState({audio: audio, track: track.name.toUpperCase()});
        }, function(err) {
          console.log('Something went wrong!', err);
        });
      } else {
        newAlarms.push(activeAlarms[i]);
      }
    }
    this.setState({activeAlarms: newAlarms});
  }


  renderAlarms() {
    let alarms = [];
    this.state.activeAlarms.map((alarm, i) => {
      let time = alarm.time._d.toLocaleTimeString();
      let end = time.length;
      time = time.substring(0, end - 6) + " " + time.substring(end - 2, end);
    alarms.push(
    <ListGroupItem style={{margin: 10, width: 500, borderStyle: 'dashed', borderWidth: '5px', borderColor: 'grey'}}>
    <div style={{display: 'flex', color: 'dimgray'}}>
        <div style={{width: 500}}>
          <div style={{fontWeight: 'bold'}}>{time}</div>
          <div style={{fontWeight: 'normal', fontSize: '16pt'}}>Playlist: {alarm.pl.name}</div>
        </div>
        <div style={{paddingTop: '12px'}}>
          <Button size="md" color="danger" onClick={()=>this.removeAlarm(alarm)}>Remove</Button>
          </div>
    </div>
    </ListGroupItem>)
    });
    return alarms;
  }

  renderPlaylists() {
    let playlists = [];
    this.state.playlists.map((pl, i) => {
      let active = this.state.selectedPl && this.state.selectedPl.id == pl.id? 'darkgray' : 'whitesmoke';
      playlists.push(<ListGroupItem 
        onClick={() => this.setActivePl(pl)}
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
        <div hidden style={{float: 'right', margin: 20}}>Hi, {(this.state.user).split(" ")[0]}</div>
        <br/>
        <center>
          {this.state.audio != null && !this.state.audio.ended &&
          <div style={{width: 200}}>
            <Input type="text" onChange={this.checkTrack} name="track" id="track" placeholder="Enter Track Title"/>
            <div style={{float: 'left', padding: 12}}>{this.state.displayText}</div>
          </div>
          }
        <div style={{marginTop: 50, color: "white", fontSize: '18pt', fontWeight: '600'}}>
         {this.state.activeAlarms.length == 0? "No Alarms" : 
         <ListGroup>{this.renderAlarms()}</ListGroup>}
        </div>
        </center>
        <div style={{right: 50, position: 'fixed', bottom: 50}}>
        <Button style={{boxShadow: '0px 0px 20px 5px lightseagreen'}}size="lg" color="warning" onClick={this.toggleModal}>+ Add Alarm</Button>
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
