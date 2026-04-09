import Types "../types/rides-and-chat";
import List "mo:core/List";
import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Principal "mo:core/Principal";

module {

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

  // Validate VIT email domain
  public func isValidVitEmail(email : Text) : Bool {
    email.endsWith(#text "@vitstudent.ac.in");
  };

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
    };
    rides.add(ride);
    ride;
  };

  // Join a ride with overbooking prevention; returns updated ride or error
  public func joinRide(
    rides : List.List<Types.Ride>,
    ride_id : Types.RideId,
    caller : Types.UserId,
  ) : Types.JoinResult {
    switch (rides.find(func(r : Types.Ride) : Bool { r.id == ride_id })) {
      case null { #err("Ride not found") };
      case (?ride) {
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
        // Remove caller from joined_users
        ride.joined_users := ride.joined_users.filter(
          func(u : Types.UserId) : Bool { not Principal.equal(u, caller) }
        );
        if (ride.seats_filled > 0) {
          ride.seats_filled := ride.seats_filled - 1;
        };
        #ok;
      };
    };
  };

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

  // Set or update a user profile (name, email, gender)
  public func upsertProfile(
    profiles : Map.Map<Types.UserId, Types.UserProfile>,
    caller : Types.UserId,
    name : Text,
    email : Text,
    gender : Types.GenderPreference,
  ) : Types.UserProfilePublic {
    switch (profiles.get(caller)) {
      case (?profile) {
        profile.name := name;
        profile.email := email;
        profile.gender := gender;
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

  // Seed 5 demo rides on canister init with varied genders
  public func seedDemoRides(
    rides : List.List<Types.Ride>,
    nextId : { var val : Nat },
    systemPrincipal : Types.UserId,
  ) {
    let now = Time.now();
    let hour : Int = 3_600_000_000_000; // 1 hour in nanoseconds

    // (destination, datetime, total_fare, seats_total, creator_gender)
    let demoData : [(Text, Int, Nat, Nat, Types.GenderPreference)] = [
      ("Chennai Airport (MAA)", now + 6 * hour, 450, 4, #female),
      ("Chennai Central Railway Station", now + 12 * hour, 350, 3, #female),
      ("Vellore Bus Stand", now + 2 * hour, 80, 4, #none),
      ("Katpadi Junction", now + 3 * hour, 60, 6, #none),
      ("Bangalore Airport (BLR)", now + 24 * hour, 900, 4, #none),
    ];

    for ((destination, datetime, total_fare, seats_total, creator_gender) in demoData.values()) {
      let ride : Types.Ride = {
        id = nextId.val;
        creator_id = systemPrincipal;
        creator_gender;
        destination;
        datetime;
        total_fare;
        seats_total;
        var seats_filled = 0;
        var joined_users = [];
      };
      rides.add(ride);
      nextId.val := nextId.val + 1;
    };
  };
};
