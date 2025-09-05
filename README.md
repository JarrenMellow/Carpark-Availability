# Carpark Finder SG

A simple web app to find available carparks in Singapore, view their locations on a map, and filter/sort by lots, type, and distance.

## Features

- Interactive map (powered by [Leaflet](https://leafletjs.com/))
- Search carparks by development or area
- Sort by available lots, name, or distance
- Filter by lot type (Cars, Heavy Vehicles, Motorcycles)
- View carpark details and open location in Google Maps
- "Locate Me" feature to show carparks nearest to your current location

## Project Structure

- [`index.html`](index.html): Main HTML file, includes UI layout and links to CSS/JS.
- [`styles.css`](styles.css): Custom styles for dark-themed UI and Leaflet tweaks.
- [`app.js`](app.js): Main application logic, including map setup, carpark data, filtering, sorting, and UI interactions.

## Getting Started

1. Clone or download this repository.
2. Open [`index.html`](index.html) in your browser.

No build steps required. All dependencies are loaded via CDN.

## Customization

- To use live carpark data, replace the mock data in [`app.js`](app.js) with a fetch to the LTA DataMall API (see comments in the file).
- Update styles in [`styles.css`](styles.css) as desired.

## Dependencies

- [Leaflet](https://leafletjs.com/) for interactive maps
- [Font Awesome](https://fontawesome.com/) for icons

##
