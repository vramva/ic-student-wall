import HashMap "mo:base/HashMap";
import Hash "mo:base/Hash";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Order "mo:base/Order";
import Int "mo:base/Int";
import Buffer "mo:base/Buffer";
import Text "mo:base/Text";
import Iter "mo:base/Iter";

actor {
    type Content = {
        #Text : Text;
        #Image: Blob;
        #Video : Blob;
    };
    type Message = {
        vote : Int;
        content : Content;
        creator : Principal;
        username : Text;
    };
    type MessageData = {
        id : Text;
        voteCheck : Text;
        message : Message;
    };
    stable var adminList = ["ivqkb-ech4a-oxnje-cfkia-sunfd-tjtji-slxpo-7l5zf-x67vb-l2nox-7qe",
                            "uaxuk-6c7a4-rmwuh-qoq5a-d4fak-ttum4-zkxnj-ilstk-fxtxd-ogrsj-cae",
                            "whhjv-xnkpj-abvma-fcuib-lkqxu-cje3g-zqeff-hr2yq-yabhq-jlcdb-4ae"];
    stable var messageId = 0;  
    var wall = HashMap.HashMap<Nat, Message>(0, Nat.equal, Hash.hash);
    var allVotes = HashMap.HashMap<Text, Text>(0, Text.equal, Text.hash);
    private stable var wallEntries : [(Nat, Message)] = [];
    private stable var votesEntries : [(Text, Text)] = [];
    private stable var wallSize = 0;

    // Add a new message to the wall
    public shared (message) func writeMessage(c : Content, user : Text) : async Nat {
        let pid = message.caller;
        let msg : Message = {vote = 0; content = c; creator = pid; username = user};
        while (wall.get(messageId) != null) {
            messageId += 1;
        };
        wall.put(messageId, msg);
        messageId += 1;
        return messageId;
    };

    public shared query(message) func greet(name : Text) : async Text {
      let caller = message.caller;
      return "Hello, " # name # "! " # "Your Principal Id is: " # Principal.toText(caller);
   };

    //Get a specific message by ID
    public shared query func getMessage(messageId : Nat) : async Result.Result<Message, Text> {
        let msg = wall.get(messageId);
            switch (msg) {
                case null   return #err("Message not found");
                case (?msg) return #ok(msg);
                };

    };

    // Update the content for a specific message by ID
    public shared (message) func updateMessage(messageId: Nat, c: Content) : async Result.Result<(), Text> {
        let pid = message.caller;
        var msg = wall.get(messageId);
            switch (msg) {
                case null   return #err("Message not found");
                case (?msg) {
                    if (pid == msg.creator) {
                        let m = {vote = msg.vote; content = c; creator = msg.creator; username = msg.username};
                        ignore wall.replace(messageId, m);
                        return #ok();
                    };
                    return #err("Principal ID doesn't match");
            };
        };
    };
    
    

 
    //Delete a specific message by ID
    public shared (message) func deleteMessage(messageId: Nat) : async Result.Result<(), Text> {
        let pid = Principal.toText(message.caller);
        let msg = wall.get(messageId);
        switch (msg) {
                case null   return #err("Message not found");
                case (?msg) {
                    if ((message.caller == msg.creator) or (isAdmin(pid))) {
                        return #ok(wall.delete(messageId));
                    }   
                    else return #err("User " # pid # " is not admin");
               };
        };
    };
 
    // Voting
    public shared func upVote(messageId: Nat) : async Result.Result<(), Text> {
        let msg = wall.get(messageId);
        switch (msg) {
            case null return #err("Message not found");
            case (?msg) {
                let m = {vote = msg.vote + 1; content = msg.content; creator = msg.creator; username = msg.username};
                ignore wall.replace(messageId, m);
                return #ok();
            };
        }
    };

    public shared func downVote(messageId: Nat) : async Result.Result<(), Text> {
        let msg = wall.get(messageId);
        switch (msg) {
            case null return #err("Message not found");
            case (?msg) {
                let m = {vote = msg.vote - 1; content = msg.content; creator = msg.creator; username = msg.username};
                ignore wall.replace(messageId, m);
                return #ok();
            };
        }
    }; 

    //Get all messages
    public shared query func getAllMessages() : async [MessageData] {
        var messages = Buffer.Buffer<MessageData>(0);
        let last = lastKey();
        for (i in Iter.range(0, last)) {
            switch ((wall.get(i))) {
                case(?msg) {
                    let idString = Int.toText(i);
                    let key = idString # ":" # Principal.toText(msg.creator);
                    var data : MessageData = { id = ""; voteCheck = ""; message = msg};
                    switch (allVotes.get(key)) {
                        case(?vote) data := {id = idString; voteCheck = vote; message = msg};
                        case(_) data := {id = idString; voteCheck = ""; message = msg};
                    };
                    messages.add(data);
                };
                case(_) ();
            }
        };
        return Buffer.toArray(messages);
    };

    //Messages compare
    private func compareVotes(m1 : Message, m2 :Message) : Order.Order {
        switch(Int.compare(m1.vote, m2.vote)) {
            case(#greater) return #less;
            case(#less) return #greater;
            case(_) return #equal;
        }
    };

    //Get all messages ordered by votes
    public shared query func getAllMessagesRanked() : async [Message] {
        var messagesRanked = Buffer.Buffer<Message>(0);
        for (msg in wall.vals()) {
            messagesRanked.add(msg);
        };
        messagesRanked.sort(compareVotes);
        return Buffer.toArray(messagesRanked);
    };

    private func isAdmin(pid : Text) : Bool {
        for (admin in adminList.vals()) {
            if (pid == admin) {
                return true;
            }
        };
        return false;
    };
    
    private func lastKey() : Nat {
        var id = 0;
        for (k in wall.keys()) {
            if (k > id) {
                id := k;
            }
        };
        return id;
    };

    system func preupgrade() {
        wallEntries := Iter.toArray(wall.entries());
        wallSize := wall.size(); 
        votesEntries := Iter.toArray(allVotes.entries());
    };

    system func postupgrade() {
        wall := HashMap.fromIter<Nat, Message>(wallEntries.vals(), wallSize, Nat.equal, Hash.hash);
        allVotes := HashMap.fromIter<Text, Text>(votesEntries.vals(), wallSize, Text.equal, Text.hash);
    }
}

