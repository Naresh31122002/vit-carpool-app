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
  authUsers : Map.Map<Types.UserId, Types.AuthUser>,
  emailIndex : Map.Map<Text, Types.UserId>,
  otpStore : Map.Map<Text, Types.OTPRecord>,
  nextRideId : { var val : Nat },
  nextMessageId : { var val : Nat },
) {

  // ── Auth endpoints ──────────────────────────────────────────────────────────

  // Sign up with VIT email and password hash
  public shared ({ caller }) func signUp(
    email : Text,
    passwordHash : Text,
    gender : Types.GenderPreference,
  ) : async Types.SignUpResult {
    RidesLib.signUp(authUsers, emailIndex, profiles, caller, email, passwordHash, gender);
  };

  // Login — verifies credentials, returns userId and gender
  public shared ({ caller }) func login(
    email : Text,
    passwordHash : Text,
  ) : async Types.AuthResult {
    RidesLib.login(authUsers, emailIndex, caller, email, passwordHash);
  };

  // Send signup OTP — validates VIT email, checks not already registered, returns OTP for demo display
  public func sendSignupOTP(email : Text) : async Types.SignUpResult {
    RidesLib.sendSignupOTP(emailIndex, otpStore, email);
  };

  // Forgot password — generates OTP and returns it in result for demo display
  public func forgotPassword(email : Text) : async Types.SignUpResult {
    RidesLib.forgotPassword(emailIndex, otpStore, email);
  };

  // Verify OTP validity
  public query func verifyOTP(email : Text, otp : Text) : async Bool {
    RidesLib.verifyOTP(otpStore, email, otp);
  };

  // Reset password after OTP verification
  public func resetPassword(
    email : Text,
    otp : Text,
    newPasswordHash : Text,
  ) : async Types.SignUpResult {
    RidesLib.resetPassword(authUsers, emailIndex, otpStore, email, otp, newPasswordHash);
  };

  // ── Ride endpoints ──────────────────────────────────────────────────────────

  // Create a new ride (creator gender is snapshotted from profile)
  public shared ({ caller }) func createRide(
    destination : Text,
    datetime : Types.Timestamp,
    total_fare : Nat,
    seats_total : Nat,
    female_only : Bool,
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
      female_only,
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

  // Join a ride directly (overbooking prevention + female_only check)
  public shared ({ caller }) func joinRide(ride_id : Types.RideId) : async Types.JoinResult {
    RidesLib.joinRide(rides, profiles, ride_id, caller);
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

  // ── Join request endpoints ──────────────────────────────────────────────────

  // Send a join request for a ride
  public shared ({ caller }) func sendJoinRequest(ride_id : Types.RideId) : async { #ok; #err : Text } {
    RidesLib.sendJoinRequest(rides, profiles, caller, ride_id);
  };

  // Approve a join request (ride creator only)
  public shared ({ caller }) func approveJoinRequest(
    ride_id : Types.RideId,
    requester_id : Text,
  ) : async { #ok : Types.RidePublic; #err : Text } {
    let requester = Principal.fromText(requester_id);
    RidesLib.approveJoinRequest(rides, ride_id, requester, caller);
  };

  // Reject a join request (ride creator only)
  public shared ({ caller }) func rejectJoinRequest(
    ride_id : Types.RideId,
    requester_id : Text,
  ) : async { #ok; #err : Text } {
    let requester = Principal.fromText(requester_id);
    RidesLib.rejectJoinRequest(rides, ride_id, requester, caller);
  };

  // Get pending join requests for a specific ride (ride creator only)
  public shared ({ caller }) func getRideRequests(ride_id : Types.RideId) : async { #ok : [Types.UserProfilePublic]; #err : Text } {
    RidesLib.getRideRequests(rides, profiles, ride_id, caller);
  };

  // Get the caller's join request statuses across all rides
  public shared query ({ caller }) func getMyRequests() : async [{ ride_id : Types.RideId; status : Types.JoinRequestStatus }] {
    RidesLib.getMyRequests(rides, caller);
  };

  // Get count of rides by other users matching the caller's preferred destination
  public shared query ({ caller }) func getDestinationMatchNotifications() : async Nat {
    RidesLib.getDestinationMatchNotifications(rides, profiles, caller);
  };

  // Get accepted join request notifications for rides owned by the caller
  public shared query ({ caller }) func getAcceptedRequestNotifications() : async [{ ride_id : Types.RideId; requester_id : Text; ride_destination : Text }] {
    RidesLib.getAcceptedRequestNotifications(rides, caller);
  };

  // ── Chat endpoints ───────────────────────────────────────────────────────────

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

  // ── Profile endpoints ───────────────────────────────────────────────────────

  // Set or update caller's user profile (name, email, gender, preferred_destination)
  public shared ({ caller }) func setProfile(
    name : Text,
    email : Text,
    gender : Types.GenderPreference,
    preferred_destination : ?Text,
  ) : async Types.UserProfilePublic {
    RidesLib.upsertProfile(profiles, caller, name, email, gender, preferred_destination);
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
