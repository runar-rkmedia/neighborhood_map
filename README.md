# Getting up and running

To install the required packages, do this:
```
pip install -r requirements.txt
```

then run this command to generate the default database:
```
python app.py --setup
```

And to start the server in debug mode:
```
python app.py
```

# Features:
- Loads different locations from a database, which can be switched between.
- Retrieves restaurants from Yelp from that area.
- Images from yelp are only loaded when viewed, to save data-traffic for users, and Yelp-servers.
- Custom markers loaded from server.

# Notes
- SAP (Knockout)
- Bootstrap/Backbone?
- Google Maps
    - Full Screen
    - Add atleast 5 locations, display them by default.
    - click on locations -> API-call to wiki, yelp, flickr, etc. (add attribution in readme)
    - animate marker
- Error handling (firewall, bad connections etc.)

https://classroom.udacity.com/nanodegrees/nd004/parts/135b6edc-f1cd-4cd9-b831-1908ede75737/modules/4fd8d440-9428-4de7-93c0-4dca17a36700/lessons/2711658591239847/concepts/26906985370923

---


# Project Overview
You will develop a single page application featuring a map of your neighborhood or a neighborhood you would like to visit. You will then add functionality to this map including highlighted locations, third-party data about those locations and various ways to browse the content.

### Why this Project?
The neighborhood map application is complex enough and incorporates a variety of data points that it can easily become unwieldy to manage. There are a number of frameworks, libraries and APIs available to make this process more manageable and many employers are looking for specific skills in using these packages.

### What will I Learn?
You will learn how design patterns assist in developing a manageable codebase. You’ll then explore how frameworks can decrease the time required developing an application and provide a number of utilities for you to use. Finally, you’ll implement third-party APIs that provide valuable data sets that can improve the quality of your application.

### How does this help my Career?
- Interacting with API servers is the primary function of Front-End Web Developers
- Use of third-party libraries and APIs is a standard and acceptable practice that is encouraged
- Asynchronous programming is important to understand in today's market
