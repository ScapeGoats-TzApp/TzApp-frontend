import { Routes } from '@angular/router';
import { LoadingComponent } from './pages/loading/loading';
import { HomePage } from './pages/home/home';
import { ExplorePage } from './pages/explore/explore';
import { SavedComponent } from './pages/saved/saved';
import { LocationComponent } from './pages/location/location';
import { SmartPlanner } from './pages/smart-planner/smart-planner';
import { ChatbotPage } from './pages/chatbot-page/chatbot-page';
import { MyProfile } from './pages/my-profile/my-profile';

export const routes: Routes = [
  { path: '', component: LoadingComponent },
  { path: 'home', component: HomePage },
  { path: 'smart-planner', component: SmartPlanner },
  { path: 'chatbot', component: ChatbotPage },
  { path: 'my-profile', component: MyProfile },
  // { path: 'explore', component: ExplorePage },
  // { path: 'saved', component: SavedComponent },
  // { path: 'location/:id', component: LocationComponent },
  { path: '**', redirectTo: '' },
];
