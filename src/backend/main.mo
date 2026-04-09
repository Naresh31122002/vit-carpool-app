import Types "types/rides-and-chat";
import RidesAndChatMixin "mixins/rides-and-chat-api";
import RidesLib "lib/rides-and-chat";

import List "mo:core/List";
import Map "mo:core/Map";
import Principal "mo:core/Principal";


actor {
  // --- Stable state ---
  let rides = List.empty<Types.Ride>();
  let messages = Map.empty<Types.RideId, List.List<Types.ChatMessage>>();
  let profiles = Map.empty<Types.UserId, Types.UserProfile>();
  let nextRideId = { var val : Nat = 0 };
  let nextMessageId = { var val : Nat = 0 };

  // --- Seed demo rides on first init ---
  RidesLib.seedDemoRides(rides, nextRideId, Principal.anonymous());

  // --- Mixins ---
  include RidesAndChatMixin(rides, messages, profiles, nextRideId, nextMessageId);
};
