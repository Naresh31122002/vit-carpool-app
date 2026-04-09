import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type RideId = Common.RideId;
  public type MessageId = Common.MessageId;

  // Gender preference variant
  public type GenderPreference = {
    #none;
    #female;
    #male;
  };

  // Internal ride record (mutable fields for seats_filled)
  public type Ride = {
    id : RideId;
    creator_id : UserId;
    creator_gender : GenderPreference; // gender of creator at time of creation
    destination : Text;
    datetime : Timestamp;
    total_fare : Nat;
    seats_total : Nat;
    var seats_filled : Nat;
    var joined_users : [UserId];
  };

  // Public (shared) ride record — no mutable fields
  public type RidePublic = {
    id : RideId;
    creator_id : Text; // Principal as Text for sharing
    creator_gender : GenderPreference;
    destination : Text;
    datetime : Timestamp;
    total_fare : Nat;
    seats_total : Nat;
    seats_filled : Nat;
    joined_users : [Text]; // Principals as Text
  };

  // User profile (internal)
  public type UserProfile = {
    id : UserId;
    var name : Text;
    var email : Text;
    var gender : GenderPreference;
    var photoData : ?[Nat8];
    var photoMime : ?Text;
  };

  // Public user profile — no mutable fields
  public type UserProfilePublic = {
    id : Text;
    name : Text;
    email : Text;
    gender : GenderPreference;
    hasPhoto : Bool;
  };

  // Chat message
  public type ChatMessage = {
    id : MessageId;
    ride_id : RideId;
    sender_id : UserId;
    content : Text;
    timestamp : Timestamp;
  };

  // Public chat message
  public type ChatMessagePublic = {
    id : MessageId;
    ride_id : RideId;
    sender_id : Text;
    content : Text;
    timestamp : Timestamp;
  };

  // Result types
  public type JoinResult = {
    #ok : RidePublic;
    #err : Text;
  };

  public type CreateRideResult = {
    #ok : RidePublic;
    #err : Text;
  };

  public type WithdrawResult = {
    #ok;
    #notJoined;
    #rideNotFound;
  };

  public type SaveMessageResult = {
    #ok : ChatMessagePublic;
    #rideNotFound;
    #notMember;
  };
};
