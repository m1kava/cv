import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ProfileTimelineComponent } from '../profile-timeline/profile-timeline.component';
@Component({selector:'app-main-page',standalone:true,imports:[ProfileCardComponent,ProfileTimelineComponent],templateUrl:'./main-page.component.html',styleUrls:['./main-page.component.scss'],changeDetection:ChangeDetectionStrategy.OnPush})
export class MainPageComponent {}
