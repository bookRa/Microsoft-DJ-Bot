/**
 * 
 * A user Profile with name, genre, and artist
 * 
  */

  class UserProfile {
      constructor(name, genre, artist){
          this.name = name || undefined;
          this.genre = genre || undefined;
          this.artist = artist || undefined;
      }
  }

  exports.UserProfile = UserProfile