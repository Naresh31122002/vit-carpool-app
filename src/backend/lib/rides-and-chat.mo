import Types "../types/rides-and-chat";
import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Int "mo:core/Int";

module {

  // ── Conversion helpers ──────────────────────────────────────────────────────

  // Convert internal Ride to public RidePublic
  public func toPublicRide(ride : Types.Ride) : Types.RidePublic {
    {
      id = ride.id;
      creator_id = ride.creator_id.toText();
      creator_gender = ride.creator_gender;
      destination = ride.destination;
      datetime = ride.datetime;
      total_fare = ride.total_fare;
      seats_total = ride.seats_total;
      seats_filled = ride.seats_filled;
      joined_users = ride.joined_users.map<Types.UserId, Text>(func u = u.toText());
      female_only = ride.female_only;
      pending_requests = ride.pending_requests.map<Types.UserId, Text>(func u = u.toText());
      confirmed_users = ride.confirmed_users.map<Types.UserId, Text>(func u = u.toText());
    };
  };

  // Convert internal UserProfile to public UserProfilePublic
  public func toPublicProfile(profile : Types.UserProfile) : Types.UserProfilePublic {
    {
      id = profile.id.toText();
      name = profile.name;
      email = profile.email;
      gender = profile.gender;
      hasPhoto = profile.photoData != null;
      preferred_destination = profile.preferred_destination;
    };
  };

  // Convert internal ChatMessage to public ChatMessagePublic
  public func toPublicMessage(msg : Types.ChatMessage) : Types.ChatMessagePublic {
    {
      id = msg.id;
      ride_id = msg.ride_id;
      sender_id = msg.sender_id.toText();
      content = msg.content;
      timestamp = msg.timestamp;
    };
  };

  // Convert JoinRequest to public
  public func toPublicRequest(req : Types.JoinRequest) : Types.JoinRequestPublic {
    {
      ride_id = req.ride_id;
      requester_id = req.requester_id.toText();
      status = req.status;
      timestamp = req.timestamp;
    };
  };

  // ── Validation ──────────────────────────────────────────────────────────────

  // Validate VIT email domain
  public func isValidVitEmail(email : Text) : Bool {
    email.endsWith(#text "@vitstudent.ac.in");
  };

  // ── Auth functions ──────────────────────────────────────────────────────────

  // Sign up — links email+passwordHash to the calling principal
  public func signUp(
    authUsers : Map.Map<Types.UserId, Types.AuthUser>,
    emailIndex : Map.Map<Text, Types.UserId>,
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    email : Text,
    passwordHash : Text,
    gender : Types.GenderPreference,
  ) : Types.SignUpResult {
    let normalizedEmail = email.toLower();

    // Validate VIT email
    if (not isValidVitEmail(normalizedEmail)) {
      return #err("Only @vitstudent.ac.in email addresses are allowed");
    };

    // Check for duplicate email
    if (emailIndex.get(normalizedEmail) != null) {
      return #err("An account with this email already exists");
    };

    // Check caller doesn't already have an account
    switch (authUsers.get(caller)) {
      case (?_) { return #err("This account already has credentials registered") };
      case null {};
    };

    let authUser : Types.AuthUser = {
      email = normalizedEmail;
      var passwordHash;
      var gender;
      createdAt = Time.now();
    };
    authUsers.add(caller, authUser);
    emailIndex.add(normalizedEmail, caller);

    // Also upsert the user profile with gender
    ignore upsertProfile(profiles, caller, "", normalizedEmail, gender, null);

    #ok("Account created successfully");
  };

  // Login — verifies email+passwordHash, returns userId and gender
  public func login(
    authUsers : Map.Map<Types.UserId, Types.AuthUser>,
    emailIndex : Map.Map<Text, Types.UserId>,
    _caller : Types.UserId,
    email : Text,
    passwordHash : Text,
  ) : Types.AuthResult {
    let normalizedEmail = email.toLower();

    switch (emailIndex.get(normalizedEmail)) {
      case null { #err("No account found with this email") };
      case (?userId) {
        switch (authUsers.get(userId)) {
          case null { #err("Account data not found") };
          case (?authUser) {
            if (authUser.passwordHash != passwordHash) {
              return #err("Incorrect password");
            };
            #ok({ userId = userId.toText(); gender = authUser.gender });
          };
        };
      };
    };
  };

  // Send signup OTP — generates 6-digit OTP for email not yet registered, returns OTP for demo display
  public func sendSignupOTP(
    emailIndex : Map.Map<Text, Types.UserId>,
    otpStore : Map.Map<Text, Types.OTPRecord>,
    email : Text,
  ) : Types.SignUpResult {
    let normalizedEmail = email.toLower();

    if (not isValidVitEmail(normalizedEmail)) {
      return #err("Only @vitstudent.ac.in emails are allowed");
    };

    if (emailIndex.get(normalizedEmail) != null) {
      return #err("Email already registered");
    };

    // Generate 6-digit OTP from current time
    let now = Time.now();
    let rawOtp = Int.abs(now) % 1_000_000;
    let otpText = padOtp(rawOtp);

    let tenMinutes : Int = 10 * 60 * 1_000_000_000; // 10 min in nanoseconds
    let record : Types.OTPRecord = {
      otp = otpText;
      expiresAt = now + tenMinutes;
      email = normalizedEmail;
    };
    otpStore.add(normalizedEmail, record);

    // Return OTP in result for demo display (email extension disabled)
    #ok("OTP generated: " # otpText);
  };

  // Forgot password — generates 6-digit OTP, stores with 10-min expiry, returns OTP for demo display
  public func forgotPassword(
    emailIndex : Map.Map<Text, Types.UserId>,
    otpStore : Map.Map<Text, Types.OTPRecord>,
    email : Text,
  ) : Types.SignUpResult {
    let normalizedEmail = email.toLower();

    if (emailIndex.get(normalizedEmail) == null) {
      return #err("No account found with this email");
    };

    // Generate 6-digit OTP from current time
    let now = Time.now();
    let rawOtp = Int.abs(now) % 1_000_000;
    let otpText = padOtp(rawOtp);

    let tenMinutes : Int = 10 * 60 * 1_000_000_000; // 10 min in nanoseconds
    let record : Types.OTPRecord = {
      otp = otpText;
      expiresAt = now + tenMinutes;
      email = normalizedEmail;
    };
    otpStore.add(normalizedEmail, record);

    // Return OTP in result for demo display (email extension disabled)
    #ok("OTP generated: " # otpText);
  };

  // Pad OTP to 6 digits with leading zeros
  private func padOtp(n : Nat) : Text {
    let s = n.toText();
    let len = s.size();
    if (len >= 6) { s }
    else {
      var pad = "";
      var i = len;
      while (i < 6) {
        pad := pad # "0";
        i := i + 1;
      };
      pad # s
    };
  };

  // Verify OTP — checks it matches and is not expired
  public func verifyOTP(
    otpStore : Map.Map<Text, Types.OTPRecord>,
    email : Text,
    otp : Text,
  ) : Bool {
    let normalizedEmail = email.toLower();
    switch (otpStore.get(normalizedEmail)) {
      case null { false };
      case (?record) {
        let now = Time.now();
        record.otp == otp and record.expiresAt > now;
      };
    };
  };

  // Reset password — verifies OTP then updates passwordHash
  public func resetPassword(
    authUsers : Map.Map<Types.UserId, Types.AuthUser>,
    emailIndex : Map.Map<Text, Types.UserId>,
    otpStore : Map.Map<Text, Types.OTPRecord>,
    email : Text,
    otp : Text,
    newPasswordHash : Text,
  ) : Types.SignUpResult {
    let normalizedEmail = email.toLower();

    if (not verifyOTP(otpStore, normalizedEmail, otp)) {
      return #err("Invalid or expired OTP");
    };

    switch (emailIndex.get(normalizedEmail)) {
      case null { #err("No account found with this email") };
      case (?userId) {
        switch (authUsers.get(userId)) {
          case null { #err("Account data not found") };
          case (?authUser) {
            authUser.passwordHash := newPasswordHash;
            // Remove used OTP
            otpStore.remove(normalizedEmail);
            #ok("Password updated successfully");
          };
        };
      };
    };
  };

  // ── Ride functions ──────────────────────────────────────────────────────────

  // Create a new ride — reads creator's gender from profile map
  public func createRide(
    rides : List.List<Types.Ride>,
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    nextId : Nat,
    creator_id : Types.UserId,
    destination : Text,
    datetime : Types.Timestamp,
    total_fare : Nat,
    seats_total : Nat,
    female_only : Bool,
  ) : Types.Ride {
    // Snapshot the creator's gender at time of ride creation
    let creator_gender : Types.GenderPreference = switch (profiles.get(creator_id)) {
      case (?profile) { profile.gender };
      case null { #none };
    };
    let ride : Types.Ride = {
      id = nextId;
      creator_id;
      creator_gender;
      destination;
      datetime;
      total_fare;
      seats_total;
      var seats_filled = 0;
      var joined_users = [];
      female_only;
      var pending_requests = [];
      var confirmed_users = [];
    };
    rides.add(ride);
    ride;
  };

  // Send a join request for a ride
  public func sendJoinRequest(
    rides : List.List<Types.Ride>,
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    ride_id : Types.RideId,
  ) : { #ok; #err : Text } {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #err("Ride not found") };
      case (?ride) {
        // Cannot request own ride
        if (Principal.equal(ride.creator_id, caller)) {
          return #err("You cannot join your own ride");
        };
        // Check female_only restriction
        if (ride.female_only) {
          let callerGender = switch (profiles.get(caller)) {
            case (?p) { p.gender };
            case null { #none };
          };
          switch (callerGender) {
            case (#female) {};
            case _ { return #err("This ride is for female students only") };
          };
        };
        // Check already in confirmed or pending
        let alreadyConfirmed = ride.confirmed_users.find(func u = Principal.equal(u, caller));
        if (alreadyConfirmed != null) {
          return #err("You have already joined this ride");
        };
        let alreadyPending = ride.pending_requests.find(func u = Principal.equal(u, caller));
        if (alreadyPending != null) {
          return #err("You already have a pending request for this ride");
        };
        if (ride.seats_filled >= ride.seats_total) {
          return #err("Ride is full");
        };
        ride.pending_requests := ride.pending_requests.concat<Types.UserId>([caller]);
        #ok;
      };
    };
  };

  // Approve a join request
  public func approveJoinRequest(
    rides : List.List<Types.Ride>,
    ride_id : Types.RideId,
    requester_id : Types.UserId,
    caller : Types.UserId,
  ) : { #ok : Types.RidePublic; #err : Text } {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #err("Ride not found") };
      case (?ride) {
        if (not Principal.equal(ride.creator_id, caller)) {
          return #err("Only the ride creator can approve requests");
        };
        let inPending = ride.pending_requests.find(func u = Principal.equal(u, requester_id));
        if (inPending == null) {
          return #err("No pending request from this user");
        };
        if (ride.seats_filled >= ride.seats_total) {
          return #err("Ride is now full");
        };
        // Move from pending to confirmed and joined_users
        ride.pending_requests := ride.pending_requests.filter(
          func(u : Types.UserId) : Bool { not Principal.equal(u, requester_id) }
        );
        ride.confirmed_users := ride.confirmed_users.concat<Types.UserId>([requester_id]);
        ride.joined_users := ride.joined_users.concat<Types.UserId>([requester_id]);
        ride.seats_filled := ride.seats_filled + 1;
        #ok(toPublicRide(ride));
      };
    };
  };

  // Reject a join request
  public func rejectJoinRequest(
    rides : List.List<Types.Ride>,
    ride_id : Types.RideId,
    requester_id : Types.UserId,
    caller : Types.UserId,
  ) : { #ok; #err : Text } {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #err("Ride not found") };
      case (?ride) {
        if (not Principal.equal(ride.creator_id, caller)) {
          return #err("Only the ride creator can reject requests");
        };
        ride.pending_requests := ride.pending_requests.filter(
          func(u : Types.UserId) : Bool { not Principal.equal(u, requester_id) }
        );
        #ok;
      };
    };
  };

  // Get pending requests for rides owned by caller
  public func getRideRequests(
    rides : List.List<Types.Ride>,
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    ride_id : Types.RideId,
    caller : Types.UserId,
  ) : { #ok : [Types.UserProfilePublic]; #err : Text } {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #err("Ride not found") };
      case (?ride) {
        if (not Principal.equal(ride.creator_id, caller)) {
          return #err("Only the ride creator can view requests");
        };
        let requestProfiles = ride.pending_requests.map(
          func(uid : Types.UserId) : Types.UserProfilePublic {
            switch (profiles.get(uid)) {
              case (?p) { toPublicProfile(p) };
              case null {
                {
                  id = uid.toText();
                  name = "Unknown";
                  email = "";
                  gender = #none;
                  hasPhoto = false;
                  preferred_destination = null;
                }
              };
            };
          }
        );
        #ok(requestProfiles);
      };
    };
  };

  // Get the caller's own join request status across all rides
  public func getMyRequests(
    rides : List.List<Types.Ride>,
    caller : Types.UserId,
  ) : [{ ride_id : Types.RideId; status : Types.JoinRequestStatus }] {
    let result = List.empty<{ ride_id : Types.RideId; status : Types.JoinRequestStatus }>();
    rides.forEach(func(ride : Types.Ride) {
      let inPending = ride.pending_requests.find(func u = Principal.equal(u, caller));
      let inConfirmed = ride.confirmed_users.find(func u = Principal.equal(u, caller));
      if (inPending != null) {
        result.add({ ride_id = ride.id; status = #pending });
      } else if (inConfirmed != null) {
        result.add({ ride_id = ride.id; status = #accepted });
      };
    });
    result.toArray();
  };

  // Join a ride with overbooking prevention; returns updated ride or error
  public func joinRide(
    rides : List.List<Types.Ride>,
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    ride_id : Types.RideId,
    caller : Types.UserId,
  ) : Types.JoinResult {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #err("Ride not found") };
      case (?ride) {
        // Check female_only restriction
        if (ride.female_only) {
          let callerGender = switch (profiles.get(caller)) {
            case (?p) { p.gender };
            case null { #none };
          };
          switch (callerGender) {
            case (#female) {};
            case _ { return #err("This ride is for female students only") };
          };
        };
        // Check if already joined
        let alreadyJoined = ride.joined_users.find(
          func u = Principal.equal(u, caller),
        );
        if (alreadyJoined != null) {
          return #err("Already joined this ride");
        };
        if (ride.seats_filled >= ride.seats_total) {
          return #err("Ride is full");
        };
        ride.seats_filled := ride.seats_filled + 1;
        ride.joined_users := ride.joined_users.concat<Types.UserId>([caller]);
        #ok(toPublicRide(ride));
      };
    };
  };

  // Withdraw from a ride; decrements seats_filled and removes caller from joined_users
  public func withdrawRide(
    rides : List.List<Types.Ride>,
    ride_id : Types.RideId,
    caller : Types.UserId,
  ) : Types.WithdrawResult {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #rideNotFound };
      case (?ride) {
        let wasJoined = ride.joined_users.find(
          func u = Principal.equal(u, caller),
        );
        if (wasJoined == null) {
          return #notJoined;
        };
        // Remove caller from joined_users and confirmed_users
        ride.joined_users := ride.joined_users.filter(
          func(u : Types.UserId) : Bool { not Principal.equal(u, caller) }
        );
        ride.confirmed_users := ride.confirmed_users.filter(
          func(u : Types.UserId) : Bool { not Principal.equal(u, caller) }
        );
        if (ride.seats_filled > 0) {
          ride.seats_filled := ride.seats_filled - 1;
        };
        #ok;
      };
    };
  };

  // ── Ride listing ────────────────────────────────────────────────────────────

  // Get all rides as public records
  public func listRides(rides : List.List<Types.Ride>) : [Types.RidePublic] {
    rides.map<Types.Ride, Types.RidePublic>(toPublicRide).toArray();
  };

  // Get rides filtered by creator gender; null means return all rides
  public func listRidesByGender(
    rides : List.List<Types.Ride>,
    gender : ?Types.GenderPreference,
  ) : [Types.RidePublic] {
    switch (gender) {
      case null { listRides(rides) };
      case (?g) {
        rides.filter(func(r : Types.Ride) : Bool {
          switch (g) {
            case (#none) { true };
            case (#female) {
              switch (r.creator_gender) {
                case (#female) { true };
                case _ { false };
              };
            };
            case (#male) {
              switch (r.creator_gender) {
                case (#male) { true };
                case _ { false };
              };
            };
            case (#lgbtq) {
              switch (r.creator_gender) {
                case (#lgbtq) { true };
                case _ { false };
              };
            };
          };
        }).map<Types.Ride, Types.RidePublic>(toPublicRide).toArray();
      };
    };
  };

  // Get a specific ride by ID
  public func getRideById(
    rides : List.List<Types.Ride>,
    ride_id : Types.RideId,
  ) : ?Types.RidePublic {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null null;
      case (?ride) ?toPublicRide(ride);
    };
  };

  // Get rides created by or joined by a specific user
  public func getMyRides(
    rides : List.List<Types.Ride>,
    caller : Types.UserId,
  ) : [Types.RidePublic] {
    rides.filter(func(r : Types.Ride) : Bool {
      Principal.equal(r.creator_id, caller) or
      r.joined_users.find<Types.UserId>(func u = Principal.equal(u, caller)) != null;
    }).map<Types.Ride, Types.RidePublic>(toPublicRide).toArray();
  };

  // Get rides posted (created) by the caller
  public func getPostedRides(
    rides : List.List<Types.Ride>,
    caller : Types.UserId,
  ) : [Types.RidePublic] {
    rides.filter(func(r : Types.Ride) : Bool {
      Principal.equal(r.creator_id, caller);
    }).map<Types.Ride, Types.RidePublic>(toPublicRide).toArray();
  };

  // Get rides joined by the caller where caller is NOT the creator
  public func getJoinedRides(
    rides : List.List<Types.Ride>,
    caller : Types.UserId,
  ) : [Types.RidePublic] {
    rides.filter(func(r : Types.Ride) : Bool {
      not Principal.equal(r.creator_id, caller) and
      r.joined_users.find<Types.UserId>(func u = Principal.equal(u, caller)) != null;
    }).map<Types.Ride, Types.RidePublic>(toPublicRide).toArray();
  };

  // ── Chat functions ───────────────────────────────────────────────────────────

  // Save a chat message for a ride — caller must be a member (creator or joined)
  public func saveMessage(
    rides : List.List<Types.Ride>,
    messages : Map.Map<Types.RideId, List.List<Types.ChatMessage>>,
    nextId : Nat,
    ride_id : Types.RideId,
    sender_id : Types.UserId,
    content : Text,
    timestamp : Types.Timestamp,
  ) : Types.SaveMessageResult {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #rideNotFound };
      case (?ride) {
        // Caller must be creator or in joined_users
        let isMember = Principal.equal(ride.creator_id, sender_id) or
          ride.joined_users.find(func u = Principal.equal(u, sender_id)) != null;
        if (not isMember) {
          return #notMember;
        };
        let msg : Types.ChatMessage = {
          id = nextId;
          ride_id;
          sender_id;
          content;
          timestamp;
        };
        switch (messages.get(ride_id)) {
          case (?msgList) { msgList.add(msg) };
          case null {
            let newList = List.empty<Types.ChatMessage>();
            newList.add(msg);
            messages.add(ride_id, newList);
          };
        };
        #ok(toPublicMessage(msg));
      };
    };
  };

  // Get all chat messages for a ride
  public func getMessages(
    messages : Map.Map<Types.RideId, List.List<Types.ChatMessage>>,
    ride_id : Types.RideId,
  ) : [Types.ChatMessagePublic] {
    switch (messages.get(ride_id)) {
      case null [];
      case (?msgList) {
        msgList.map<Types.ChatMessage, Types.ChatMessagePublic>(toPublicMessage).toArray();
      };
    };
  };

  // ── Profile functions ───────────────────────────────────────────────────────

  // Set or update a user profile (name, email, gender, preferred_destination)
  public func upsertProfile(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    name : Text,
    email : Text,
    gender : Types.GenderPreference,
    preferred_destination : ?Text,
  ) : Types.UserProfilePublic {
    switch (profiles.get(caller)) {
      case (?profile) {
        profile.name := name;
        profile.email := email;
        profile.gender := gender;
        profile.preferred_destination := preferred_destination;
        toPublicProfile(profile);
      };
      case null {
        let profile : Types.UserProfile = {
          id = caller;
          var name;
          var email;
          var gender;
          var photoData = null;
          var photoMime = null;
          var preferred_destination;
        };
        profiles.add(caller, profile);
        toPublicProfile(profile);
      };
    };
  };

  // Get a user profile by caller
  public func getProfile(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
  ) : ?Types.UserProfilePublic {
    switch (profiles.get(caller)) {
      case null null;
      case (?profile) ?toPublicProfile(profile);
    };
  };

  // Set profile photo for a user
  public func setProfilePhoto(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    data : [Nat8],
    mime : Text,
  ) {
    switch (profiles.get(caller)) {
      case (?profile) {
        profile.photoData := ?data;
        profile.photoMime := ?mime;
      };
      case null {
        // Create a minimal profile entry to store the photo
        let profile : Types.UserProfile = {
          id = caller;
          var name = "";
          var email = "";
          var gender = #none;
          var photoData = ?data;
          var photoMime = ?mime;
          var preferred_destination = null;
        };
        profiles.add(caller, profile);
      };
    };
  };

  // Get profile photo for any user by userId
  public func getProfilePhoto(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    userId : Types.UserId,
  ) : ?{ data : [Nat8]; mime : Text } {
    switch (profiles.get(userId)) {
      case null { null };
      case (?profile) {
        switch (profile.photoData, profile.photoMime) {
          case (?data, ?mime) { ?{ data; mime } };
          case _ { null };
        };
      };
    };
  };

  // ── Notification helpers ─────────────────────────────────────────────────────

  // Get count of rides by OTHER users that match the caller's preferred_destination
  public func getDestinationMatchNotifications(
    rides : List.List<Types.Ride>,
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
  ) : Nat {
    let preferredDest : ?Text = switch (profiles.get(caller)) {
      case null { null };
      case (?p) { p.preferred_destination };
    };
    switch (preferredDest) {
      case null { 0 };
      case (?dest) {
        let destLower = dest.toLower();
        var count : Nat = 0;
        rides.forEach(func(ride : Types.Ride) {
          if (not Principal.equal(ride.creator_id, caller) and ride.destination.toLower() == destLower) {
            count := count + 1;
          };
        });
        count;
      };
    };
  };

  // Get accepted join request notifications for rides owned by caller
  // Returns list of { ride_id, requester_id (Text), ride_destination }
  public func getAcceptedRequestNotifications(
    rides : List.List<Types.Ride>,
    caller : Types.UserId,
  ) : [{ ride_id : Types.RideId; requester_id : Text; ride_destination : Text }] {
    let result = List.empty<{ ride_id : Types.RideId; requester_id : Text; ride_destination : Text }>();
    rides.forEach(func(ride : Types.Ride) {
      if (Principal.equal(ride.creator_id, caller)) {
        for (uid in ride.confirmed_users.values()) {
          result.add({
            ride_id = ride.id;
            requester_id = uid.toText();
            ride_destination = ride.destination;
          });
        };
      };
    });
    result.toArray();
  };

  // ── Seed demo rides ─────────────────────────────────────────────────────────

  // Seed 5 demo rides on canister init with varied genders
  public func seedDemoRides(
    rides : List.List<Types.Ride>,
    nextId : { var val : Nat },
    systemPrincipal : Types.UserId,
  ) {
    let now = Time.now();
    let hour : Int = 3_600_000_000_000; // 1 hour in nanoseconds

    // Mock requester principal for demo confirmed users
    let mockRequester = Principal.fromText("2vxsx-fae");

    // (destination, datetime, total_fare, seats_total, creator_gender, female_only, seats_filled, confirmed_users)
    let demoData : [(Text, Int, Nat, Nat, Types.GenderPreference, Bool, Nat, [Types.UserId])] = [
      ("Chennai Airport (MAA)", now + 6 * hour, 450, 4, #female, true, 0, []),
      ("Chennai Central Railway Station", now + 12 * hour, 350, 3, #female, false, 1, [mockRequester]),
      ("Vellore Bus Stand", now + 2 * hour, 80, 4, #none, false, 0, []),
      ("Katpadi Junction", now + 3 * hour, 60, 6, #none, false, 0, []),
      ("Bangalore Airport (BLR)", now + 24 * hour, 900, 4, #none, false, 1, [mockRequester]),
    ];

    for ((destination, datetime, total_fare, seats_total, creator_gender, female_only, seats_filled, confirmed) in demoData.values()) {
      let ride : Types.Ride = {
        id = nextId.val;
        creator_id = systemPrincipal;
        creator_gender;
        destination;
        datetime;
        total_fare;
        seats_total;
        var seats_filled;
        var joined_users = confirmed;
        female_only;
        var pending_requests = [];
        var confirmed_users = confirmed;
      };
      rides.add(ride);
      nextId.val := nextId.val + 1;
    };
  };
};
