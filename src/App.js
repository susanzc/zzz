import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import { Button, Modal, ModalHeader, ModalFooter, ModalBody } from 'reactstrap';
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
    this.state = { token: "", user: "", modalOpen: false, content: [], time: new Date()}
    this.loadUser = this.loadUser.bind(this);
    this.authenticationComplete = this.authenticationComplete.bind(this);
    this.tokenSaved = this.tokenSaved.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.onChangeTime = this.onChangeTime.bind(this);
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
    }
  }

  authenticationComplete() {
    return (window.location.href.includes("access_token") || this.tokenSaved());
  }

  tokenSaved() {
    return window.location.href.includes("success") && sessionStorage.getItem("token");
  }

  toggleModal() {
    this.setState({modalOpen: !this.state.modalOpen})
  }

  onChangeTime(time) {
    this.setState({time: time});
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

  render() {
    return (
      <div className="App">
        <div style={{float: 'right', margin: 20}}>Hi, {(this.state.user).split(" ")[0]}</div>
        <div style={{right: 50, position: 'absolute', bottom: 50}}><Button size="lg" color="primary" onClick={this.toggleModal}>+ Add Alarm</Button></div>
        <Modal isOpen={this.state.modalOpen} toggle={this.toggleModal}>
          <ModalHeader toggle={this.toggleModal}>Add Alarm</ModalHeader>
          <ModalBody>
          <TimePicker
            showSecond={false}
            defaultValue={moment().hour(0).minute(0)}
            onChange={this.onChange}
            format={'h:mm a'}
            use12Hours
            inputReadOnly
          />
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={this.toggleModal}>Add</Button>{' '}
            <Button color="secondary" onClick={this.toggleModal}>Cancel</Button>
          </ModalFooter>
        </Modal>
      </div>
    );
  }
}

export default App;
