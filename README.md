# Store Trading Hours Check Tool

A Firebase & jQuery based javascript component to let you to be able to check store trading hours near you.

## How do I get set up? ##

### Pre-requisites

* [Git client](https://gitforwindows.org/) 
    * NOTE: It's recommended that you add the Git client to the Windows Path so you can use it directly from regular command line/prompt. This is an option during install with most installers. 
* [Google Firebase](https://firebase.google.com/)
    * Note: A realtime database is required
* Optional [Google Map Api](https://developers.google.com/maps/)
    * In this case we have a static data dump ready to query the nearest store list by suburb name/postcode. However, Google map api will be required to extend the functionaliy to query the nearest store list by current geo location.

### Firebase database setup

The following database structure is desired:

```
"tgg-api": {
  "postcode-api": {}, //Return all suburbs under each postcode
  "store-api": {}, //All stores listed base on postcode
  "store-detail-api": {}, //Store detail for each store
  "suburb-api": {} //Return postcodes for all exsiting suburb name
}
```

For example data structre please refer to api.json

### Config Firebase connection on your page

```
var config = {
    apiKey: "*******",
    authDomain: "***.firebaseapp.com",
    databaseURL: "https://***.firebaseio.com",
    projectId: "tgg-api",
    storageBucket: "***.appspot.com",
    messagingSenderId: "***"
};
firebase.initializeApp(config);
```

### How to use git to contribute or get updates?

Have a quick read through [The simple guide to GIT](http://rogerdudler.github.io/git-guide/) before proceeding.

*NOTE: Ensure that you are aware if any branches in use, always make sure you are working in the correct branch. If you're using Cmder it will tell you what branch you're in in brackets at the end of your path.
