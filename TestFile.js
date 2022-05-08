import React, { Component } from 'react'
import { Permission } from 'react-native-permissions'
import { Text, View, Button, Alert } from 'react-native';
import { PermissionsAndroid } from 'react-native';
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import RNLocation from 'react-native-location'
import Toast from 'react-native-simple-toast'

RNLocation.configure({
  distanceFilter: 0, // Meters
  desiredAccuracy: {
    ios: "best",
    android: "balancedPowerAccuracy"
  },
  // Android only
  androidProvider: "auto",
  interval: 1000, // Milliseconds
  fastestInterval: 1000, // Milliseconds
  maxWaitTime: 0, // Milliseconds
  // iOS Only
  activityType: "other",
  allowsBackgroundLocationUpdates: false,
  headingFilter: 1, // Degrees
  headingOrientation: "portrait",
  pausesLocationUpdatesAutomatically: false,
  showsBackgroundLocationIndicator: false,
})
let locationSubscription = null;
let locationTimeout = null;

export default class TestFile extends Component {

  constructor(props) {
    super(props)

    this.state = {
      x: '',
      y: ''
    }
  }

  componentDidMount() {
    this.requestPermissions()
    setInterval(() => {
      this.getCoordinatesSet()
    }, 30000);
  }

  async requestPermissions() {
    const backgroundgranted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
      {
        title: 'Background Location Permission',
        message:
          'We need access to your location ' +
          'so you can get live quality updates.',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      },
    );
    if (backgroundgranted === PermissionsAndroid.RESULTS.GRANTED) {
      RNLocation.getLatestLocation({ timeout: 1000 })
        .then(latestLocation => {
          console.log("Latest Locations are:=> ", latestLocation)
        })
      ReactNativeForegroundService.add_task(
        () => {
          RNLocation.requestPermission({
            ios: 'whenInUse',
            android: {
              detail: 'fine',
            },
          }).then((granted) => {
            // console.log('Location Permissions: ', granted);
            // if has permissions try to obtain location with RN location
            if (granted) {
              locationSubscription && locationSubscription();
              locationSubscription = RNLocation.subscribeToLocationUpdates(
                ([locations]) => {
                  locationSubscription();
                  locationTimeout && clearTimeout(locationTimeout);
                  console.log("Location data is =>", locations);
                  let xaxis = locations.latitude;
                  this.setState({ x: xaxis })
                  console.log("Value of x", this.state.x)
                  let yaxis = locations.longitude;
                  this.setState({ y: yaxis })
                },
              );
            } else {
              locationSubscription && locationSubscription();
              locationTimeout && clearTimeout(locationTimeout);
              console.log('no permissions to obtain location');
            }
          });
        },
        {
          delay: 1000,
          onLoop: true,
          taskId: 'taskid',
          onError: (e) => console.log('Error logging:', e),
        },
      );
    }
  }

  getCoordinatesSet() {

    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    var raw = JSON.stringify({
      lat: this.state.x,
      lng: this.state.y
    });

    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: raw,
      redirect: 'follow'
    };

    fetch("https://xtriven.com/api/driver_app_loc", requestOptions)
      .then(response => response.json())
      .then(result => {
        console.log(result)
        console.log("Value of x in 200 response", this.state.x)
        Toast.show(result.message + "Data", Toast.SHORT)
      })
      .catch(error => console.log('error', error));


  }


  render() {

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Wait for 30 sec the location will be saved to server</Text>
        <Text>Allow the location from the settings of the app manually</Text>
        {/* <Button title='Click' onPress={() => this.alertFunction()} /> */}
      </View>
    )
  }
}