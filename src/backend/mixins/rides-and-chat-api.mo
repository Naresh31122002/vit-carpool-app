import Types "../types/rides-and-chat";
import RidesLib "../lib/rides-and-chat";
import List "mo:core/List";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

mixin (
  rides : List.List<Types.Ride>,
  messages : Map.Map<Types.RideId, List.List<Types.ChatMessage>>,
  profiles : Map.Map<Types.UserId, Types.UserProfile>,
  nextRideId : { var val : Nat },
  nextMessageId : { var val : Nat },
) {

  // Create a new ride (creator gender is snapshotted from profile)
  public shared ({ caller }) func createRide(
    destination : Text,
    datetime : Types.Timestamp,
    total_fare : Nat,
    seats_total : Nat,
  ) : async Types.CreateRideResult {
    if (destination == "") {
      return #err("Destination cannot be empty");
    };
    if (seats_total == 0) {
      return #err("Must have at least 1 seat");
    };
    let ride = RidesLib.createRide(
      rides,
      profiles,
      nextRideId.val,
      caller,
      destination,
      datetime,
      total_fare,
      seats_total,
    );
    nextRideId.val := nextRideId.val + 1;
    #ok(RidesLib.toPublicRide(ride));
  };

  // List all rides (no filter)
  public query func getRides() : async [Types.RidePublic] {
    RidesLib.listRides(rides);
  };

  // List rides filtered by creator gender; pass ?#female to see female-only rides
  public query func getGenderFilteredRides(gender : ?Types.GenderPreference) : async [Types.RidePublic] {
    RidesLib.listRidesByGender(rides, gender);
  };

  // Join a ride (overbooking prevention)
  public shared ({ caller }) func joinRide(ride_id : Types.RideId) : async Types.JoinResult {
    RidesLib.joinRide(rides, ride_id, caller);
  };

  // Withdraw from a ride; frees up the seat
  public shared ({ caller }) func withdrawRide(ride_id : Types.RideId) : async Types.WithdrawResult {
    RidesLib.withdrawRide(rides, ride_id, caller);
  };

  // Get details for a specific ride
  public query func getRideDetails(ride_id : Types.RideId) : async ?Types.RidePublic {
    RidesLib.getRideById(rides, ride_id);
  };

  // Get rides created by or joined by the caller
  public shared query ({ caller }) func getMyRides() : async [Types.RidePublic] {
    RidesLib.getMyRides(rides, caller);
  };

  // Get only rides posted (created) by the caller
  public shared query ({ caller }) func getPostedRides() : async [Types.RidePublic] {
    RidesLib.getPostedRides(rides, caller);
  };

  // Get only rides joined by the caller (where caller is not the creator)
  public shared query ({ caller }) func getJoinedRides() : async [Types.RidePublic] {
    RidesLib.getJoinedRides(rides, caller);
  };

  // Save a chat message for a ride
  public shared ({ caller }) func saveMessage(
    ride_id : Types.RideId,
    content : Text,
  ) : async Types.SaveMessageResult {
    let result = RidesLib.saveMessage(
      rides,
      messages,
      nextMessageId.val,
      ride_id,
      caller,
      content,
      Time.now(),
    );
    switch (result) {
      case (#ok _) { nextMessageId.val := nextMessageId.val + 1 };
      case _ {};
    };
    result;
  };

  // Get all chat messages for a ride
  public query func getMessages(ride_id : Types.RideId) : async [Types.ChatMessagePublic] {
    RidesLib.getMessages(messages, ride_id);
  };

  // Set or update caller's user profile (name, email, gender)
  public shared ({ caller }) func setProfile(
    name : Text,
    email : Text,
    gender : Types.GenderPreference,
  ) : async Types.UserProfilePublic {
    RidesLib.upsertProfile(profiles, caller, name, email, gender);
  };

  // Get the caller's user profile
  public shared query ({ caller }) func getProfile() : async ?Types.UserProfilePublic {
    RidesLib.getProfile(profiles, caller);
  };

  // Set or update caller's profile photo
  public shared ({ caller }) func setProfilePhoto(data : [Nat8], mime : Text) : async () {
    RidesLib.setProfilePhoto(profiles, caller, data, mime);
  };

  // Get profile photo for any user by userId (Text)
  public query func getProfilePhoto(userId : Text) : async ?{ data : [Nat8]; mime : Text } {
    let principal = Principal.fromText(userId);
    RidesLib.getProfilePhoto(profiles, principal);
  };
};
