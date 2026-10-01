import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentTrack: null,
  queue: [],
  queueIndex: -1, // single source of truth for "where we are" in the queue
  isPlaying: false,
  volume: 1,
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    
    setTrack: (state, action) => {
      state.currentTrack = action.payload;
      state.isPlaying = true;
    },

    setPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },

    setVolumeState: (state, action) => {
      state.volume = action.payload;
    },

    // Replace the whole queue and start playing at startIndex
    playQueue: (state, action) => {
      const { tracks, startIndex = 0 } = action.payload;
      state.queue = tracks;
      state.queueIndex = startIndex;
      state.currentTrack = tracks[startIndex] ?? state.currentTrack;
      state.isPlaying = true;
    },

    // Append tracks fetched from getUpNext / autoplay, without disturbing playback
    addManyToQueue: (state, action) => {
      state.queue.push(...action.payload);
      if (state.queueIndex === -1 && state.queue.length) {
        state.queueIndex = 0;
      }
    },

    addToQueue: (state, action) => {
      state.queue.push(action.payload);
      if (state.queueIndex === -1) {
        state.queueIndex = 0;
      }
    },

    // Insert right after the currently playing track ("play next")
    playNext: (state, action) => {
      const insertAt = state.queueIndex + 1;
      state.queue.splice(insertAt, 0, action.payload);
    },

    removeFromQueue: (state, action) => {
      const index = action.payload;
      state.queue.splice(index, 1);
      if (index < state.queueIndex) {
        state.queueIndex -= 1;
      } else if (index === state.queueIndex) {
        state.currentTrack = state.queue[state.queueIndex] || null;
      }
    },

    reorderQueue: (state, action) => {
      const { fromIndex, toIndex } = action.payload; // object, not array — clearer at call sites
      const [moved] = state.queue.splice(fromIndex, 1);
      state.queue.splice(toIndex, 0, moved);

      if (fromIndex === state.queueIndex) state.queueIndex = toIndex;
      else if (fromIndex < state.queueIndex && toIndex >= state.queueIndex) state.queueIndex -= 1;
      else if (fromIndex > state.queueIndex && toIndex <= state.queueIndex) state.queueIndex += 1;
    },

    // Jump straight to a specific queue item (clicking a row in the Queue tab)
    playTrackAt: (state, action) => {
      const index = action.payload;
      if (index < 0 || index >= state.queue.length) return;
      state.queueIndex = index;
      state.currentTrack = state.queue[index];
      state.isPlaying = true;
    },

    nextTrack: (state) => {
      if (state.queue.length === 0 || state.queueIndex === -1) return;
      const nextIndex = (state.queueIndex + 1) % state.queue.length;
      state.queueIndex = nextIndex;
      state.currentTrack = state.queue[nextIndex];
      state.isPlaying = true;
    },

    prevTrack: (state) => {
      if (state.queue.length === 0 || state.queueIndex === -1) return;
      const prevIndex = state.queueIndex === 0 ? state.queue.length - 1 : state.queueIndex - 1;
      state.queueIndex = prevIndex;
      state.currentTrack = state.queue[prevIndex];
      state.isPlaying = true;
    },

    clearQueue: (state) => {
      state.queue = [];
      state.queueIndex = -1;
      state.currentTrack = null;
      state.isPlaying = false;
    },
  },
});

export const {
  setTrack,
  setPlaying,
  setVolumeState,
  playQueue,
  addManyToQueue,
  addToQueue,
  playNext,
  removeFromQueue,
  reorderQueue,
  playTrackAt,
  nextTrack,
  prevTrack,
  clearQueue,
} = playerSlice.actions;

export default playerSlice.reducer;