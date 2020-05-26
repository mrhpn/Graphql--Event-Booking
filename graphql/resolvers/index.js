const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Event = require("../../models/event");
const User = require("../../models/user");

const user = async (userId) => {
  let user = await User.findById({ _id: userId });
  return {
    ...user._doc,
    id: user.id,
    createdEvents: events.bind(this, user._doc.createdEvents),
  };
};

const events = async (eventIds) => {
  let events = await Event.find({ _id: { $in: eventIds } });
  return events.map((event) => {
    return {
      ...event._doc,
      _id: event.id,
      creator: user.bind(this, event.creator),
    };
  });
};

module.exports = {
  events: () => {
    return Event.find()
      .then((events) => {
        return events.map((event) => {
          return {
            ...event._doc,
            creator: user.bind(this, event.creator),
          };
        });
      })
      .catch((err) => {
        throw err;
      });
  },
  createEvent: (args) => {
    const event = new Event({
      title: args.eventInput.title,
      description: args.eventInput.description,
      price: +args.eventInput.price,
      date: new Date(args.eventInput.date),
      creator: "5ecbdea0edc51a2b98ff57d4",
    });

    let createdEvent;

    return event
      .save()
      .then((result) => {
        createdEvent = {
          ...result._doc,
          _id: result.id,
          creator: user.bind(this, result._doc.creator),
        };
        return User.findById("5ecbdea0edc51a2b98ff57d4");
      })
      .then((user) => {
        console.log(user);
        if (!user) {
          throw new Error("User not found.");
        }
        user.createdEvents.push(event);
        return user.save();
      })
      .then((result) => {
        return createdEvent;
      })
      .catch((err) => {
        console.log(err);
        throw err;
      });
  },
  createUser: (args) => {
    return User.find({ email: args.userInput.email })
      .then((user) => {
        if (user.length === 1) {
          throw new Error("User already exists.");
        }

        return bcrypt.hash(args.userInput.password, 12);
      })
      .then((hashedPassword) => {
        const user = new User({
          name: args.userInput.name,
          email: args.userInput.email,
          password: hashedPassword,
        });

        return user.save();
      })
      .then((result) => {
        return { ...result._doc, _id: result.id, password: null };
      })
      .catch((err) => {
        throw err;
      });
  },
};
