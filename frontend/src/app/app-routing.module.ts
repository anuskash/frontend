import { InboxComponent } from './inbox/inbox.component';
import { ConversationComponent } from './conversation/conversation.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'inbox', component: InboxComponent },
  { path: 'conversation', component: ConversationComponent },
  { path: '**', component: PageNotFoundComponent },
];