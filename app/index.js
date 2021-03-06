import App from './src/App';
import PlanetDrawer from './src/PlanetDrawer';

// Load application styles
import './styles/style.css';
import SpaceDrawer from './src/SpaceDrawer';

let app;

window.onload = function () {
	app = new App();
	
	app.AddDrawer(new SpaceDrawer());
	app.AddDrawer(new PlanetDrawer());

	app.DrawScene();
};
