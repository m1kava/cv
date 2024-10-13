import { Component } from '@angular/core';
import {ProfileCardComponent} from '../profile-card/profile-card.component';
import {ProfileTimelineComponent} from '../profile-timeline/profile-timeline.component';

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    ProfileCardComponent,
    ProfileTimelineComponent
  ],
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.scss'
})
export class MainPageComponent {

}
