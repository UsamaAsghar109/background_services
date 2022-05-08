import React, { useEffect, useState } from 'react';
import { Text, View, Button } from 'react-native';
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

export default function RootScreen() {

    const [xState, setXState] = useState('');
    const [yState, setYState] = useState('')

    const requestPermission = async () => {
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

                                    let latitude = locations.latitude;
                                    setXState(latitude);
                                    let longitute = locations.longitude;
                                    setYState(longitute);

                                    getCoordinatesSet()
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
    const getCoordinatesSet = async () => {

        var myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");

        var raw = JSON.stringify({
            lat: xState,
            lng: yState
        });

        var requestOptions = {
            method: 'POST',
            headers: myHeaders,
            body: raw,
            redirect: 'follow'
        };

        await fetch("https://xtriven.com/api/driver_app_loc", requestOptions)
            .then(response => response.json())
            .then(result => console.log(result))
            .catch(error => console.log('error', error));


    }
    useEffect(() => {

        requestPermission();
        getCoordinatesSet();
    }, [xState, yState])

    return (
        <View>
            <Text>Background Location</Text>
            <Text>Value of lat {xState}</Text>
            <Text>Value of lng {yState}</Text>
            <Button title='Click on' onPress={() => getCoordinatesSet()} />
        </View>
    );
};
