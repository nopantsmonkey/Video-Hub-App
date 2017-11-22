import { Component, ChangeDetectorRef, OnInit, HostListener } from '@angular/core';

import { ElectronService } from '../../providers/electron.service';
import { ShowLimitService } from 'app/components/pipes/show-limit.service';
import { WordFrequencyService } from 'app/components/pipes/word-frequency.service';

import { FinalObject } from '../common/final-object.interface';

import { SearchButtons, SearchButtonsOrder } from '../common/search-buttons';
import { Filters } from '../common/filters';
import { GalleryButtons, GalleryButtonsOrder } from '../common/gallery-buttons';
import { AppState } from '../common/app-state';
import { setTimeout } from 'timers';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: [
    './layout.scss',
    './settings.scss',
    './search.scss',
    './photon/buttons.scss',
    './photon/icons.scss',
    './gallery.scss',
    './film-override.scss',
    './wizard.scss'
  ]
})
export class HomeComponent implements OnInit {

  // searchButtons & filters -- arrays must be in the same order to correspond correctly !!!
  searchButtons = SearchButtons;
  searchButtonsOrder = SearchButtonsOrder;
  filters = Filters;

  // Array is in the order in which the buttons will be rendered
  galleryButtons = GalleryButtons;
  galleryButtonsOrder = GalleryButtonsOrder;

  // App state to save -- so it can be exported and saved when closing the app
  appState = AppState;

  // REORGANIZE / keep
  currentPlayingFile = '';
  currentPlayingFolder = '';
  magicSearchString = '';

  importDone = false;
  inProgress = false;
  progressPercent = 0;

  appMaximized = false;

  imgHeight = 100;

  settingsNowShown = false;

  // temp
  wordFreqArr: any;
  currResults: any = { showing: 0, total: 0 };

  public finalArray = [];

  constructor(
    public cd: ChangeDetectorRef,
    public showLimitService: ShowLimitService,
    public wordFrequencyService: WordFrequencyService,
    public electronService: ElectronService
  ) { }

  ngOnInit() {

    setTimeout(() => {
      this.wordFrequencyService.finalMapBehaviorSubject.subscribe((value) => {
        this.wordFreqArr = value;
        // this.cd.detectChanges();
      });
      this.showLimitService.searchResults.subscribe((value) => {
        this.currResults = value;
        this.cd.detectChanges();
      });
    }, 100);

    // Returning Input
    this.electronService.ipcRenderer.on('inputFolderChosen', (event, filePath) => {
      this.appState.selectedSourceFolder = filePath;
    });

    // Returning Output
    this.electronService.ipcRenderer.on('outputFolderChosen', (event, filePath) => {
      this.appState.selectedOutputFolder = filePath;
    });

    // Progress bar messages
    this.electronService.ipcRenderer.on('processingProgress', (event, a, b) => {
      this.inProgress = true; // handle this variable better later
      console.log(a + ' out of ' + b);
      this.progressPercent = a / b;
    });

    // Final object returns
    this.electronService.ipcRenderer.on('finalObjectReturning', (event, finalObject: FinalObject) => {
      this.appState.selectedOutputFolder = finalObject.outputDir;
      this.appState.selectedSourceFolder = finalObject.inputDir;
      this.importDone = true;
      this.finalArray = finalObject.images;
    });
  }

  // INTERACT WITH ELECTRON

  public loadFromFile() {
    // console.log('loading file');
    this.electronService.ipcRenderer.send('load-the-file', 'some thing sent');
  }

  public selectSourceDirectory() {
    // console.log('select input directory');
    this.electronService.ipcRenderer.send('choose-input', 'sending some message also');
  }

  public selectOutputDirectory() {
    // console.log('select output directory');
    this.electronService.ipcRenderer.send('choose-output', 'sending some message also');
  }

  public importFresh() {
    // console.log('fresh import');
    this.electronService.ipcRenderer.send('start-the-import', 'sending some message');
  }

  public initiateMinimize() {
    this.electronService.ipcRenderer.send('minimize-window', 'lol');
  }

  public initiateMaximize() {
    if (this.appMaximized === false) {
      this.electronService.ipcRenderer.send('maximize-window', 'lol');
      this.appMaximized = true;
    } else {
      this.electronService.ipcRenderer.send('un-maximize-window', 'lol');
      this.appMaximized = false;
    }
  }

  public initiateClose() {
    this.electronService.ipcRenderer.send('close-window', 'lol');
  }

  // HTML calls this
  public openVideo(number) {
    this.currentPlayingFolder = this.finalArray[number][0];
    this.currentPlayingFile = this.finalArray[number][2];
    this.openExternalFile(this.appState.selectedSourceFolder + this.finalArray[number][0] + '/' + this.finalArray[number][1]);
  }

  // Open the file in system default program
  public openExternalFile(fullPath) {
    // console.log('trying to open ' + fullPath);
    // console.log('sike! DISABLED :)')
    this.electronService.ipcRenderer.send('openThisFile', fullPath);
  }

  // -----------------------------------------------------------------------------------------------
  // handle output from top.component

  /**
   * Add filter to FILE search when word in file is clicked
   * @param filter
   */
  handleFileWordClicked(filter: string) {
    this.onEnterKey(filter, 3); // 3rd item is the `file` filter
  }

  /**
   * Add filter to FOLDER search when word in folder is clicked
   * @param filter
   */
  handleFolderWordClicked(filter: string) {
    this.onEnterKey(filter, 1); // 1st item is the `folder` filter
  }

  // -----------------------------------------------------------------------------------------------
  // Interaction functions

  /**
   * Toggle a search button
   * @param button
   */
  toggleSearchButton(button: string) {
    this.searchButtons[button].toggled = !this.searchButtons[button].toggled;
  }

  /**
   * Show or hide settings
   * settingsNowShown used for *ngIf
   */
  toggleSettings() {
    if (this.settingsNowShown === false) {
      this.settingsNowShown = true;
      setTimeout(() => {
        this.appState.buttonsInView = false;
      }, 10);
    } else {
      this.appState.buttonsInView = true;
      setTimeout(() => {
        this.settingsNowShown = false;
      }, 500);
    }
  }

  /**
   * Perform appropriate action when a gallery button is clicked
   * @param   uniqueKey   the uniqueKey string of the button
   */
  toggleGalleryButton(uniqueKey: string): void {
    if (uniqueKey === 'showThumbnails') {
      this.galleryButtons['showThumbnails'].toggled = true;
      this.galleryButtons['showFilmstrip'].toggled = false;
      this.galleryButtons['showFiles'].toggled = false;
      this.appState.currentView = 'thumbs';
    } else if (uniqueKey === 'showFilmstrip') {
      this.galleryButtons['showThumbnails'].toggled = false;
      this.galleryButtons['showFilmstrip'].toggled = true;
      this.galleryButtons['showFiles'].toggled = false;
      this.appState.currentView = 'filmstrip';
    } else if (uniqueKey === 'showFiles') {
      this.galleryButtons['showThumbnails'].toggled = false;
      this.galleryButtons['showFilmstrip'].toggled = false;
      this.galleryButtons['showFiles'].toggled = true;
      this.appState.currentView = 'files';
    } else if (uniqueKey === 'makeSmaller') {
      this.decreaseSize();
    } else if (uniqueKey === 'makeLarger') {
      this.increaseSize();
    } else {
      this.galleryButtons[uniqueKey].toggled = !this.galleryButtons[uniqueKey].toggled;
    }
  }

  /**
   * Decrease preview size
   */
  public decreaseSize(): void {
    if (this.imgHeight > 50) {
      this.imgHeight = this.imgHeight - 25;
    }
  }

  /**
   * Increase preview size
   */
  public increaseSize(): void {
    if (this.imgHeight < 200) {
      this.imgHeight = this.imgHeight + 25;
    }
  }

  /**
   * Add search string to filter array
   * When user presses the `ENTER` key
   * @param value  -- the string to filter
   * @param origin -- can be `file`, `fileUnion`, `folder`, `folderUnion` -- KEYS for the `filters` Array
   */
  onEnterKey(value: string, origin: number): void {
    const trimmed = value.trim();
    if (trimmed) {
      this.filters[origin].array.push(trimmed);
      this.filters[origin].bool = !this.filters[origin].bool;
      this.filters[origin].string = '';
    }
  }

  /**
   * Removes last-added filter
   * When user presses the `BACKSPACE` key
   * @param origin  -- array from which to .pop()
   */
  onBackspace(value: string, origin: number): void {
    // TODO -- bug -- if user removes the 1st character with a backspace key, it removes last-entered filter
    if (value === '' && this.filters[origin].array.length > 0) {
      this.filters[origin].array.pop();
      this.filters[origin].bool = !this.filters[origin].bool;
    }
  }

  /**
   * Removes item from particular search array
   * When user clicks on a particular search word
   * @param item    {number}  index within array of search strings
   * @param origin  {number}  index within filters array
   */
  removeThisFilter(item: number, origin: number): void {
    this.filters[origin].array.splice(item, 1);
    this.filters[origin].bool = !this.filters[origin].bool;
  }

  /**
   * Toggle the visibility of the searchButtons
   * @param item  -- index within the searchButtons array to toggle
   */
  toggleHideSearchButton(item: string) {
    this.searchButtons[item].hidden = !this.searchButtons[item].hidden;
  }

  /**
   * Toggle the visibility of the galleryButtons
   * @param item  -- index within the galleryButtons array to toggle
   */
  toggleHideGalleryButton(item: string) {
    this.galleryButtons[item].hidden = !this.galleryButtons[item].hidden;
  }

  /**
   * Show or hide the settings menu
   */
  toggleSettingsMenu() {
    this.appState.menuHidden = !this.appState.menuHidden;
  }

  /**
   * Hide or show the top of the app
   */
  toggleTopVisible() {
    this.appState.topHidden = !this.appState.topHidden;
  }

}
