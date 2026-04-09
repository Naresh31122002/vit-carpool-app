import Common "common";

module {
  public type UserId = Common.UserId;
  public type Timestamp = Common.Timestamp;
  public type RideId = Common.RideId;
  public type MessageId = Common.MessageId;

  // Gender preference variant — includes lgbtq
  public type GenderPreference = {
    #none;
    #female;
    #male;
    #lgbtq;
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
    female_only : Bool; // if true, only female users can join
    var pending_requests : [UserId];
    var confirmed_users : [UserId];
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
    female_only : Bool;
    pending_requests : [Text];
    confirmed_users : [Text];
  };

  // User profile (internal)
  public type UserProfile = {
    id : UserId;
    var name : Text;
    var email : Text;
    var gender : GenderPreference;
    var photoData : ?[Nat8];
    var photoMime : ?Text;
    var preferred_destination : ?Text;
  };

  // Public user profile — no mutable fields
  public type UserProfilePublic = {
    id : Text;
    name : Text;
    email : Text;
    gender : GenderPreference;
    hasPhoto : Bool;
    preferred_destination : ?Text;
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

  // Auth user — email/password credentials linked to a principal
  public type AuthUser = {
    email : Text;
    var passwordHash : Text;
    var gender : GenderPreference;
    createdAt : Timestamp;
  };

  // OTP record for forgot password flow
  public type OTPRecord = {
    otp : Text;
    expiresAt : Timestamp;
    email : Text;
  };

  // Join request record
  public type JoinRequest = {
    ride_id : RideId;
    requester_id : UserId;
    status : JoinRequestStatus;
    timestamp : Timestamp;
  };

  public type JoinRequestStatus = {
    #pending;
    #accepted;
    #rejected;
  };

  // Public join request
  public type JoinRequestPublic = {
    ride_id : RideId;
    requester_id : Text;
    status : JoinRequestStatus;
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

  // Auth result types
  public type AuthResult = {
    #ok : { userId : Text; gender : GenderPreference };
    #err : Text;
  };

  public type SignUpResult = {
    #ok : Text;
    #err : Text;
  };
};
