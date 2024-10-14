import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { ProfileCardComponent } from '../profile-card/profile-card.component';
import { ProfileTimelineComponent } from '../profile-timeline/profile-timeline.component';
import {NgIf} from '@angular/common';

const activeTab = {
  Profile: 'Profile',
  Timeline: 'Timeline'
};

@Component({
  selector: 'app-main-page',
  standalone: true,
  imports: [
    ProfileCardComponent,
    ProfileTimelineComponent,
    NgIf
  ],
  templateUrl: './main-page.component.html',
  styleUrls: ['./main-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MainPageComponent {
  activeTab = activeTab.Profile;
  isSmallScreen = false;

  constructor() {
    this.checkScreenSize();
  }

  // Method to set the active tab
  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // Listen to window resize events and update screen size
  @HostListener('window:resize', ['$event'])
  onResize(event: any): void {
    this.checkScreenSize();
  }

  // Check if the screen size is less than or equal to 768px
  checkScreenSize(): void {
    this.isSmallScreen = window.innerWidth <= 768;
  }
}
