/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/**
 * <p> An interval action is an action that takes place within a certain period of time. <br/>
 * It has an start time, and a finish time. The finish time is the parameter<br/>
 * duration plus the start time.</p>
 *
 * <p>These CCActionInterval actions have some interesting properties, like:<br/>
 * - They can run normally (default)  <br/>
 * - They can run reversed with the reverse method   <br/>
 * - They can run with the time altered with the Accelerate, AccelDeccel and Speed actions. </p>
 *
 * <p>For example, you can simulate a Ping Pong effect running the action normally and<br/>
 * then running it again in Reverse mode. </p>
 *
 * @class
 * @extends cc.FiniteTimeAction
 * @Example
 * // example
 * var pingPongAction = cc.Sequence.create(action, action.reverse());
 */
cc.ActionInterval = cc.FiniteTimeAction.extend(/** @lends cc.ActionInterval# */{
    _elapsed:0,
    _firstTick:false,

    /** how many seconds had elapsed since the actions started to run.
     * @return {Number}
     */
    getElapsed:function () {
        return this._elapsed;
    },

    /** initializes the action
     * @param {Number} d duration in seconds
     * @return {Boolean}
     */
    initWithDuration:function (d) {
        this._duration = (d == 0) ? cc.FLT_EPSILON : d;
        // prevent division by 0
        // This comparison could be in step:, but it might decrease the performance
        // by 3% in heavy based action games.
        this._elapsed = 0;
        this._firstTick = true;
        return true;
    },

    /** returns true if the action has finished
     * @return {Boolean}
     */
    isDone:function () {
        return (this._elapsed >= this._duration);
    },

    /**
     * @param {Number} dt delta time in seconds
     */
    step:function (dt) {
        if (this._firstTick) {
            this._firstTick = false;
            this._elapsed = 0;
        }
        else {
            this._elapsed += dt;
        }
        this.update((1 > (this._elapsed / this._duration)) ? this._elapsed / this._duration : 1);
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._elapsed = 0;
        this._firstTick = true;
    },

    /**
     * @return {Null}
     */
    reverse:function () {
        /*
         NSException* myException = [NSException
         exceptionWithName:@"ReverseActionNotImplemented"
         reason:@"Reverse Action not implemented"
         userInfo:nil];
         @throw myException;
         */
        return null;
    },

    /**
     * @param {Number} amp
     */
    setAmplitudeRate:function (amp) {
        cc.Assert(0, 'Actioninterval setAmplitudeRate');
    },

    /**
     * @return {Number}
     */
    getAmplitudeRate:function () {
        cc.Assert(0, 'Actioninterval getAmplitudeRate');
        return 0;
    }
});

/**
 * @param {Number} d duration in seconds
 * @return {cc.ActionInterval}
 * @example
 * // example
 * var actionInterval = cc.ActionInterval.create(3);
 */
cc.ActionInterval.create = function (d) {
    var action = new cc.ActionInterval();
    action.initWithDuration(d);
    return action;
};


/** Runs actions sequentially, one after another
 * @class
 * @extends cc.ActionInterval
 */
cc.Sequence = cc.ActionInterval.extend(/** @lends cc.Sequence# */{
    _actions:null,
    _split:null,
    _last:0,

    /**
     * Constructor
     */
    ctor:function () {
        this._actions = [];
    },

    /** initializes the action <br/>
     * @param {cc.FiniteTimeAction} actionOne
     * @param {cc.FiniteTimeAction} actionTwo
     * @return {Boolean}
     */
    initOneTwo:function (actionOne, actionTwo) {
        cc.Assert(actionOne != null, "Sequence.initOneTwo");
        cc.Assert(actionTwo != null, "Sequence.initOneTwo");

        var one = actionOne.getDuration();
        var two = actionTwo.getDuration();
        if (isNaN(one) || isNaN(two)) {
            console.log(actionOne);
            console.log(actionTwo);
        }
        var d = actionOne.getDuration() + actionTwo.getDuration();
        this.initWithDuration(d);

        this._actions[0] = actionOne;
        this._actions[1] = actionTwo;

        return true;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._split = this._actions[0].getDuration() / this._duration;
        this._last = -1;
    },

    /**
     * stop the action
     */
    stop:function () {
        this._actions[0].stop();
        this._actions[1].stop();
        this._super();
    },

    /**
     * @param {Number} time  time in seconds
     */
    update:function (time) {
        var found = 0;
        var new_t = 0;
        if (time >= this._split) {
            found = 1;
            new_t = (this._split == 1) ? 1 : (time - this._split) / (1 - this._split);
        }
        else {
            found = 0;
            new_t = (this._split != 0) ? time / this._split : 1;
        }
        if (this._last == -1 && found == 1) {
            this._actions[0].startWithTarget(this._target);
            this._actions[0].update(1);
            this._actions[0].stop();
        }
        if (this._last != found) {
            if (this._last != -1) {
                this._actions[this._last].update(1);
                this._actions[this._last].stop();
            }

            this._actions[found].startWithTarget(this._target);
        }
        this._actions[found].update(new_t);
        this._last = found;
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.Sequence._actionOneTwo(this._actions[1].reverse(), this._actions[0].reverse());
    }
});
/** helper constructor to create an array of sequenceable actions
 * @param {Array|cc.FiniteTimeAction} tempArray
 * @return {cc.FiniteTimeAction}
 * @example
 * // example
 * // create sequence with actions
 * var seq = cc.Sequence.create(act1, act2);
 *
 * // create sequence with array
 * var seq = cc.Sequence.create(actArray);
 */
cc.Sequence.create = function (/*Multiple Arguments*/tempArray) {
    var paraArray = (typeof tempArray == "Array") ? tempArray : arguments;
    var prev = paraArray[0];
    for (var i = 1; i < paraArray.length; i++) {
        if (paraArray[i] != null) {
            prev = cc.Sequence._actionOneTwo(prev, paraArray[i]);
        }
    }
    return prev;

};

/** creates the action
 * @param {cc.FiniteTimeAction} actionOne
 * @param {cc.FiniteTimeAction} actionTwo
 * @return {cc.Sequence}
 * @private
 */
cc.Sequence._actionOneTwo = function (actionOne, actionTwo) {
    var sequence = new cc.Sequence();
    sequence.initOneTwo(actionOne, actionTwo);
    return sequence;
};


/** Repeats an action a number of times.
 * To repeat an action forever use the CCRepeatForever action.
 * @class
 * @extends cc.ActionInterval
 */
cc.Repeat = cc.ActionInterval.extend(/** @lends cc.Repeat# */{
    _times:0,
    _total:0,
    _innerAction:null, //CCFiniteTimeAction

    /**
     * @param {cc.FiniteTimeAction} action
     * @param {Number} times
     * @return {Boolean}
     */
    initWithAction:function (action, times) {
        var d = action.getDuration() * times;

        if (this.initWithDuration(d)) {
            this._times = times;
            this._innerAction = action;
            this._total = 0;
            return true;
        }
        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._total = 0;
        this._super(target);
        this._innerAction.startWithTarget(target);
    },

    /**
     * stop the action
     */
    stop:function () {
        this._innerAction.stop();
        this._super();
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        var t = time * this._times;
        if (t > this._total + 1) {
            this._innerAction.update(1);
            this._total++;
            this._innerAction.stop();
            this._innerAction.startWithTarget(this._target);

            // repeat is over?
            if (this._total == this._times) {
                // so, set it in the original position
                this._innerAction.update(0);
            }
            else {
                // no ? start next repeat with the right update
                // to prevent jerk (issue #390)
                this._innerAction.update(t - this._total);
            }
        }
        else {
            var r = t % 1;

            // fix last repeat position
            // else it could be 0.
            if (time == 1) {
                r = 1;
                this._total++; // this is the added line
            }

            //		other->update(min(r, 1));
            this._innerAction.update((r > 1) ? 1 : r);
        }
    },

    /**
     * @return {Boolean}
     */
    isDone:function () {
        return this._total == this._times;
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.Repeat.create(this._innerAction.reverse(), this._times);
    },

    /**
     * @param {cc.FiniteTimeAction} action
     */
    setInnerAction:function (action) {
        if (this._innerAction != action) {
            this._innerAction = action;
        }
    },

    /**
     * @return {cc.FiniteTimeAction}
     */
    getInnerAction:function () {
        return this._innerAction;
    }
});
/** creates a CCRepeat action. Times is an unsigned integer between 1 and pow(2,30)
 * @param {cc.FiniteTimeAction} action
 * @param {Number} times
 * @return {cc.Repeat}
 * @example
 * // example
 * var rep = cc.Repeat.create(cc.Sequence.create(jump2, jump1), 5);
 */
cc.Repeat.create = function (action, times) {
    var repeat = new cc.Repeat();
    repeat.initWithAction(action, times);
    return repeat;
};


/**  Repeats an action for ever.  <br/>
 * To repeat the an action for a limited number of times use the Repeat action. <br/>
 * @warning This action can't be Sequenceable because it is not an IntervalAction
 * @class
 * @extends cc.ActionInterval
 */

cc.RepeatForever = cc.ActionInterval.extend(/** @lends cc.RepeatForever# */{
    _innerAction:null, //CCActionInterval

    /**
     * @param {cc.ActionInterval} action
     * @return {Boolean}
     */
    initWithAction:function (action) {
        cc.Assert(action != null, "");

        this._innerAction = action;
        return true;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._innerAction.startWithTarget(target);
    },

    /**
     * @param dt delta time in seconds
     */
    step:function (dt) {
        this._innerAction.step(dt);
        if (this._innerAction.isDone()) {
            var diff = dt + this._innerAction.getDuration() - this._innerAction.getElapsed();
            this._innerAction.startWithTarget(this._target);
            // to prevent jerk. issue #390
            this._innerAction.step(diff);
        }
    },

    /**
     * @return {Boolean}
     */
    isDone:function () {
        return false;
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return (cc.RepeatForever.create(this._innerAction.reverse()));
    },

    /**
     *
     * @param {cc.ActionInterval} action
     */
    setInnerAction:function (action) {
        if (this._innerAction != action) {
            this._innerAction = action;
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    getInnerAction:function () {
        return this._innerAction;
    }
});
/**
 * Repeat the acton forever
 * @param action
 * @return {cc.RepeatForever}
 * @example
 * // example
 * var repeat = cc.RepeatForever.create(cc.RotateBy.create(1.0, 360));
 */
cc.RepeatForever.create = function (action) {
    var ret = new cc.RepeatForever();
    if (ret && ret.initWithAction(action)) {
        return ret;
    }
    return null;
};


/** Spawn a new action immediately
 * @class
 * @extends cc.ActionInterval
 */
cc.Spawn = cc.ActionInterval.extend(/** @lends cc.Spawn# */{
    /** initializes the Spawn action with the 2 actions to spawn
     * @param {cc.FiniteTimeAction} action1
     * @param {cc.FiniteTimeAction} action2
     * @return {Boolean}
     */
    initOneTwo:function (action1, action2) {
        cc.Assert(action1 != null, "no action1");
        cc.Assert(action2 != null, "no action2");

        var ret = false;

        var d1 = action1.getDuration();
        var d2 = action2.getDuration();

        if (this.initWithDuration(Math.max(d1, d2))) {
            this._one = action1;
            this._two = action2;

            if (d1 > d2) {
                this._two = cc.Sequence._actionOneTwo(action2, cc.DelayTime.create(d1 - d2));
            } else if (d1 < d2) {
                this._one = cc.Sequence._actionOneTwo(action1, cc.DelayTime.create(d2 - d1));
            }

            ret = true;
        }
        return ret;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._one.startWithTarget(target);
        this._two.startWithTarget(target);
    },

    /**
     * Stop the action
     */
    stop:function () {
        this._one.stop();
        this._two.stop();
        this._super();
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        if (this._one) {
            this._one.update(time);
        }
        if (this._two) {
            this._two.update(time);
        }
    },

    /**
     * @return {cc.FiniteTimeAction}
     */
    reverse:function () {
        return cc.Spawn._actionOneTwo(this._one.reverse(), this._two.reverse());
    },
    _one:null,
    _two:null
});

/**
 * @param {Array|cc.FiniteTimeAction}tempArray
 * @return {cc.FiniteTimeAction}
 * @example
 * // example
 * var action = cc.Spawn.create(cc.JumpBy.create(2, cc.PointMake(300, 0), 50, 4), cc.RotateBy.create(2, 720));
 */
cc.Spawn.create = function (/*Multiple Arguments*/tempArray) {
    var paramArray = (typeof tempArray == "Array") ? tempArray : arguments;
    var prev = paramArray[0];
    for (var i = 1; i < paramArray.length; i++) {
        if (paramArray[i] != null) {
            prev = this._actionOneTwo(prev, paramArray[i]);
        }
    }
    return prev;
};

/**
 * @param {cc.FiniteTimeAction} action1
 * @param {cc.FiniteTimeAction} action2
 * @return {cc.Spawn}
 * @private
 */
cc.Spawn._actionOneTwo = function (action1, action2) {
    var pSpawn = new cc.Spawn();
    pSpawn.initOneTwo(action1, action2);

    return pSpawn;
};


/** Rotates a cc.Node object to a certain angle by modifying it's
 * rotation attribute. <br/>
 * The direction will be decided by the shortest angle.
 * @class
 * @extends cc.ActionInterval
 */
cc.RotateTo = cc.ActionInterval.extend(/** @lends cc.RotateTo# */{
    _dstAngle:0,
    _startAngle:0,
    _diffAngle:0,
    /**
     * @param {Number} duration
     * @param {Number} deltaAngle
     * @return {Boolean}
     */
    initWithDuration:function (duration, deltaAngle) {
        if (this._super(duration)) {
            this._dstAngle = deltaAngle;
            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);

        this._startAngle = target.getRotation();

        if (this._startAngle > 0) {
            this._startAngle = this._startAngle % 360.0;
        }
        else {
            this._startAngle = this._startAngle % 360.0;
        }

        this._diffAngle = this._dstAngle - this._startAngle;
        if (this._diffAngle > 180) {
            this._diffAngle -= 360;
        }

        if (this._diffAngle < -180) {
            this._diffAngle += 360;
        }
    },

    /**
     * RotateTo reverse not implemented
     */
    reverse:function () {
        cc.Assert(0, "RotateTo reverse not implemented");
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        if (this._target) {
            this._target.setRotation(this._startAngle + this._diffAngle * time);
        }
    }
});

/**
 * @param {Number} duration duration in seconds
 * @param {Number} deltaAngle deltaAngle in degrees.
 * @return {cc.RotateTo}
 * @example
 * // example
 * var rotateTo = cc.RotateTo.create(2, 61.0);
 */
cc.RotateTo.create = function (duration, deltaAngle) {
    var rotateTo = new cc.RotateTo();
    rotateTo.initWithDuration(duration, deltaAngle);

    return rotateTo;
};


/** Rotates a cc.Node object clockwise a number of degrees by modifying it's rotation attribute.
 * @class
 * @extends  cc.ActionInterval
 */
cc.RotateBy = cc.ActionInterval.extend(/** @lends cc.RotateBy# */{
    _angle:0,
    _startAngle:0,

    /**
     * @param {Number} duration duration in seconds
     * @param {Number} deltaAngle deltaAngle in degrees
     * @return {Boolean}
     */
    initWithDuration:function (duration, deltaAngle) {
        if (this._super(duration)) {
            this._angle = deltaAngle;
            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._startAngle = target.getRotation();
    },

    /**
     * @param {Number} time
     */
    update:function (time) {
        if (this._target) {
            this._target.setRotation(this._startAngle + this._angle * time);
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.RotateBy.create(this._duration, -this._angle);
    }
});

/**
 * @param {Number} duration druation in seconds
 * @param {Number} deltaAngle deltaAngle in degrees
 * @return {cc.RotateBy}
 * @example
 * // example
 * var actionBy = cc.RotateBy.create(2, 360);
 */
cc.RotateBy.create = function (duration, deltaAngle) {
    var rotateBy = new cc.RotateBy();
    rotateBy.initWithDuration(duration, deltaAngle);

    return rotateBy;
};


/** Moves a cc.Node object to the position x,y. x and y are absolute coordinates by modifying it's position attribute.
 * @class
 * @extends cc.ActionInterval
 */
cc.MoveTo = cc.ActionInterval.extend(/** @lends cc.MoveTo# */{
    /**
     * @param {Number} duration duration in seconds
     * @param {cc.Poin} position
     * @return {Boolean}
     */
    initWithDuration:function (duration, position) {
        if (this._super(duration)) {
            this._endPosition = position;
            return true;
        }

        return false;
    },

    /**
     * @param {Number} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._startPosition = target.getPosition();
        this._delta = cc.ccpSub(this._endPosition, this._startPosition);
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        if (this._target) {
            this._target.setPosition(cc.ccp(this._startPosition.x + this._delta.x * time,
                this._startPosition.y + this._delta.y * time));
        }
    },

    /**
     * MoveTo reverse is not implemented
     */
    reverse:function () {
        cc.Assert(0, "moveto reverse is not implemented");
    },
    _endPosition:new cc.Point(),
    _startPosition:new cc.Point(),
    _delta:new cc.Point()
});

/**
 * @param {Number} duration duration in seconds
 * @param {cc.Point} position
 * @return {cc.MoveTo}
 * @example
 * // example
 * var actionTo = cc.MoveTo.create(2, cc.PointMake(windowSize.width - 40, windowSize.height - 40));
 */
cc.MoveTo.create = function (duration, position) {
    var moveTo = new cc.MoveTo();
    moveTo.initWithDuration(duration, position);

    return moveTo;
};


/** Moves a cc.Node object x,y pixels by modifying it's position attribute. <br/>
 * x and y are relative to the position of the object. <br/>
 * @class
 * @extends cc.MoveTo
 */
cc.MoveBy = cc.MoveTo.extend(/** @lends cc.MoveBy# */{

    /**
     * @param {Number} duration  duration in seconds
     * @param {cc.Point} position
     * @return {Boolean}
     */
    initWithDuration:function (duration, position) {
        if (this._super(duration, position)) {
            this._delta = position;
            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        var temp = this._delta;
        this._super(target);
        this._delta = temp;
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.MoveBy.create(this._duration, cc.ccp(-this._delta.x, -this._delta.y));
    }
});
/**
 * @param {Number} duration duration in seconds
 * @param {cc.Point} position
 * @return {cc.MoveBy}
 * @example
 * // example
 * var actionBy = cc.MoveBy.create(2, cc.PointMake(80, 80));
 */
cc.MoveBy.create = function (duration, position) {
    var moveBy = new cc.MoveBy();
    moveBy.initWithDuration(duration, position);

    return moveBy;
};


/** Skews a cc.Node object to given angles by modifying it's skewX and skewY attributes
 * @class
 * @extends cc.ActionInterval
 */
cc.SkewTo = cc.ActionInterval.extend(/** @lends cc.SkewTo# */{
    /**
     * @param {Number} t time in seconds
     * @param {Number} sx
     * @param {Number} sy
     * @return {Boolean}
     */
    initWithDuration:function (t, sx, sy) {
        var ret = false;

        if (this._super(t)) {
            this._endSkewX = sx;
            this._endSkewY = sy;

            ret = true;
        }

        return ret;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);

        this._startSkewX = target.getSkewX();


        if (this._startSkewX > 0) {
            this._startSkewX = this._startSkewX % 180;
        }
        else {
            this._startSkewX = this._startSkewX % -180;
        }

        this._deltaX = this._endSkewX - this._startSkewX;

        if (this._deltaX > 180) {
            this._deltaX -= 360;
        }
        if (this._deltaX < -180) {
            this._deltaX += 360;
        }


        this._startSkewY = target.getSkewY();
        if (this._startSkewY > 0) {
            this._startSkewY = this._startSkewY % 360;
        }
        else {
            this._startSkewY = this._startSkewY % -360;
        }

        this._deltaY = this._endSkewY - this._startSkewY;

        if (this._deltaY > 180) {
            this._deltaY -= 360;
        }
        if (this._deltaY < -180) {
            this._deltaY += 360;
        }
    },

    /**
     * @param {Number} t time in seconds
     */
    update:function (t) {
        this._target.setSkewX(this._startSkewX + this._deltaX * t);

        this._target.setSkewY(this._startSkewY + this._deltaY * t);
    },
    _skewX:0,
    _skewY:0,
    _startSkewX:0,
    _startSkewY:0,
    _endSkewX:0,
    _endSkewY:0,
    _deltaX:0,
    _deltaY:0
});
/**
 * @param {Number} t time in seconds
 * @param {Number} sx
 * @param {Number} sy
 * @return {cc.SkewTo}
 * @example
 * // example
 * var actionTo = cc.SkewTo.create(2, 37.2, -37.2);
 */

cc.SkewTo.create = function (t, sx, sy) {
    var skewTo = new cc.SkewTo();
    if (skewTo) {
        skewTo.initWithDuration(t, sx, sy)
    }
    return skewTo;
};


/** Skews a cc.Node object by skewX and skewY degrees
 * @class
 * @extends cc.SkewTo
 */
cc.SkewBy = cc.SkewTo.extend(/** @lends cc.SkewBy# */{
    /**
     * @param {Number} t time in seconds
     * @param {Number} deltaSkewX  skew in degrees for X axis
     * @param {Number} deltaSkewY  skew in degrees for Y axis
     * @return {Boolean}
     */
    initWithDuration:function (t, deltaSkewX, deltaSkewY) {
        var ret = false;

        if (this._super(t, deltaSkewX, deltaSkewY)) {
            this._skewX = deltaSkewX;
            this._skewY = deltaSkewY;

            ret = true;
        }

        return ret;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._deltaX = this._skewX;
        this._deltaY = this._skewY;
        this._endSkewX = this._startSkewX + this._deltaX;
        this._endSkewY = this._startSkewY + this._deltaY;
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.SkewBy.create(this._duration, -this._skewX, -this._skewY);
    }
});
/**
 * @param {Number} t time in seconds
 * @param {Number} sx sx skew in degrees for X axis
 * @param {Number} sy sy skew in degrees for Y axis
 * @return {cc.SkewBy}
 * @example
 * // example
 * var actionBy = cc.SkewBy.create(2, 0, -90);
 */
cc.SkewBy.create = function (t, sx, sy) {
    var skewBy = new cc.SkewBy();
    if (skewBy) {
        skewBy.initWithDuration(t, sx, sy);
    }

    return skewBy;
};


/**  Moves a cc.Node object simulating a parabolic jump movement by modifying it's position attribute.
 * @class
 * @extends cc.ActionInterval
 */
cc.JumpBy = cc.ActionInterval.extend(/** @lends cc.JumpBy# */{
    /**
     * @param {Number} duration
     * @param {cc.Point} position
     * @param {Number} height
     * @param {Number} jumps
     * @return {Boolean}
     */
    initWithDuration:function (duration, position, height, jumps) {
        if (this._super(duration)) {
            this._delta = position;
            this._height = height;
            this._jumps = jumps;

            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._startPosition = target.getPosition();
    },

    /**
     * @param {Number} time
     */
    update:function (time) {
        if (this._target) {
            var frac = time * this._jumps % 1.0;
            var y = this._height * 4 * frac * (1 - frac);
            y += this._delta.y * time;
            var x = this._delta.x * time;
            this._target.setPosition(cc.ccp(this._startPosition.x + x, this._startPosition.y + y));
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.JumpBy.create(this._duration, cc.ccp(-this._delta.x, -this._delta.y), this._height, this._jumps);
    },
    _startPosition:new cc.Point(),
    _delta:new cc.Point(),
    _height:0,
    _jumps:0
});

/**
 * @param {Number} duration
 * @param {cc.Point} position
 * @param {Number} height
 * @param {Number} jumps
 * @return {cc.JumpBy}
 * @example
 * // example
 * var actionBy = cc.JumpBy.create(2, cc.PointMake(300, 0), 50, 4);
 */
cc.JumpBy.create = function (duration, position, height, jumps) {
    var jumpBy = new cc.JumpBy();
    jumpBy.initWithDuration(duration, position, height, jumps);

    return jumpBy;
};


/**  Moves a cc.Node object to a parabolic position simulating a jump movement by modifying it's position attribute.
 * @class
 * @extends cc.JumpBy
 */
cc.JumpTo = cc.JumpBy.extend(/** cc.JumpTo# */{
    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._delta = cc.ccp(this._delta.x - this._startPosition.x, this._delta.y - this._startPosition.y);
    }
});

/**
 * @param {Number} duration
 * @param {cc.Point} position
 * @param {Number} height
 * @param {Number} jumps
 * @return {cc.JumpTo}
 * @example
 * // example
 * var actionTo = cc.JumpTo.create(2, cc.PointMake(300, 300), 50, 4);
 */
cc.JumpTo.create = function (duration, position, height, jumps) {
    var jumpTo = new cc.JumpTo();
    jumpTo.initWithDuration(duration, position, height, jumps);

    return jumpTo;
};

/** bezier configuration structure
 * @class
 * @extends cc.Class
 */
cc.BezierConfig = cc.Class.extend({
    /**
     * Constructor
     */
    ctor:function () {
        this.endPosition = new cc.Point();
        this.controlPoint_1 = new cc.Point();
        this.controlPoint_2 = new cc.Point();
    }
});

/**
 * @function
 * @param {Number} a
 * @param {Number} b
 * @param {Number} c
 * @param {Number} d
 * @param {Number} t
 * @return {Number}
 */
cc.bezierat = function (a, b, c, d, t) {
    return (Math.pow(1 - t, 3) * a +
        3 * t * (Math.pow(1 - t, 2)) * b +
        3 * Math.pow(t, 2) * (1 - t) * c +
        Math.pow(t, 3) * d );
};

/** An action that moves the target with a cubic Bezier curve by a certain distance.
 * @class
 * @extends cc.ActionInterval
 */
cc.BezierBy = cc.ActionInterval.extend(/** @lends cc.BezierBy# */{
    /**
     * @param {Number} t time in seconds
     * @param {cc.BezierConfig} c
     * @return {Boolean}
     */
    initWithDuration:function (t, c) {
        if (this._super(t)) {
            this._config = c;
            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._startPosition = target.getPosition();
    },

    /**
     * @param {Number} time
     */
    update:function (time) {
        if (this._target) {
            var xa = 0;
            var xb = this._config.controlPoint_1.x;
            var xc = this._config.controlPoint_2.x;
            var xd = this._config.endPosition.x;

            var ya = 0;
            var yb = this._config.controlPoint_1.y;
            var yc = this._config.controlPoint_2.y;
            var yd = this._config.endPosition.y;

            var x = cc.bezierat(xa, xb, xc, xd, time);
            var y = cc.bezierat(ya, yb, yc, yd, time);
            this._target.setPosition(cc.ccpAdd(this._startPosition, cc.ccp(x, y)));
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        var r = new cc.BezierConfig();

        r.endPosition = cc.ccpNeg(this._config.endPosition);
        r.controlPoint_1 = cc.ccpAdd(this._config.controlPoint_2, cc.ccpNeg(this._config.endPosition));
        r.controlPoint_2 = cc.ccpAdd(this._config.controlPoint_1, cc.ccpNeg(this._config.endPosition));

        var action = cc.BezierBy.create(this._duration, r);
        return action;
    },

    /**
     * Constructor
     */
    ctor:function () {
        this._config = new cc.BezierConfig();
        this._startPosition = new cc.Point();
    }
});

/**
 * @param {Number} t time in seconds
 * @param {cc.BezierConfig} c
 * @return {cc.BezierBy}
 * @example
 * // example
 * var bezier = new cc.BezierConfig();
 * bezier.controlPoint_1 = cc.PointMake(0, windowSize.height / 2);
 * bezier.controlPoint_2 = cc.PointMake(300, -windowSize.height / 2);
 * bezier.endPosition = cc.PointMake(300, 100);
 *
 * var bezierForward = cc.BezierBy.create(3, bezier);
 *
 */
cc.BezierBy.create = function (t, c) {
    var bezierBy = new cc.BezierBy();
    bezierBy.initWithDuration(t, c);

    return bezierBy;
};


/** An action that moves the target with a cubic Bezier curve to a destination point.
 * @class
 * @extends cc.BezierBy
 */
cc.BezierTo = cc.BezierBy.extend(/** @lends cc.BezierTo# */{
    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._config.controlPoint_1 = cc.ccpSub(this._config.controlPoint_1, this._startPosition);
        this._config.controlPoint_2 = cc.ccpSub(this._config.controlPoint_2, this._startPosition);
        this._config.endPosition = cc.ccpSub(this._config.endPosition, this._startPosition);
    }
});
/**
 * @param {Number} t
 * @param {cc.BezierConfig} c
 * @return {cc.BezierTo}
 * @example
 * // example
 *  var bezier = new cc.BezierConfig();
 * bezier.controlPoint_1 = cc.PointMake(100, windowSize.height / 2);
 * bezier.controlPoint_2 = cc.PointMake(200, -windowSize.height / 2);
 * bezier.endPosition = cc.PointMake(240, 160);
 *
 * var bezierTo = cc.BezierTo.create(2, bezier);
 */
cc.BezierTo.create = function (t, c) {
    var bezierTo = new cc.BezierTo();
    bezierTo.initWithDuration(t, c);

    return bezierTo;
};


/** Scales a cc.Node object to a zoom factor by modifying it's scale attribute.
 * @warning This action doesn't support "reverse"
 * @class
 * @extends cc.ActionInterval
 */
cc.ScaleTo = cc.ActionInterval.extend(/** @lends cc.ScaleTo# */{
    /**
     * @param {Number} duration
     * @param {Number} sx
     * @param {Number} sy
     * @return {Boolean}
     */
    initWithDuration:function (duration, sx, sy)//function overload here
    {
        if (this._super(duration)) {
            this._endScaleX = sx;
            this._endScaleY = (sy != null) ? sy : sx;

            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._startScaleX = target.getScaleX();
        this._startScaleY = target.getScaleY();
        this._deltaX = this._endScaleX - this._startScaleX;
        this._deltaY = this._endScaleY - this._startScaleY;
    },

    /**
     * @param {Number} time
     */
    update:function (time) {
        if (this._target) {
            this._target.setScaleX(this._startScaleX + this._deltaX * time);
            this._target.setScaleY(this._startScaleY + this._deltaY * time);
        }
    },
    _scaleX:1,
    _scaleY:1,
    _startScaleX:1,
    _startScaleY:1,
    _endScaleX:0,
    _endScaleY:0,
    _deltaX:0,
    _deltaY:0
});
/**
 * @param {Number} duration
 * @param {Number} sx  scale parameter in X
 * @param {Number|Null} sy scale parameter in Y, if Null equal to sx
 * @return {cc.ScaleTo}
 * @example
 * // example
 * // It scales to 0.5 in both X and Y.
 * var actionTo = cc.ScaleTo.create(2, 0.5);
 *
 * // It scales to 0.5 in x and 2 in Y
 * var actionTo = cc.ScaleTo.create(2, 0.5, 2);
 */
cc.ScaleTo.create = function (duration, sx, sy)//function overload
{
    var scaleTo = new cc.ScaleTo();
    if (sy) {
        scaleTo.initWithDuration(duration, sx, sy);
    }
    else {
        scaleTo.initWithDuration(duration, sx);
    }

    return scaleTo;
};


/** Scales a cc.Node object a zoom factor by modifying it's scale attribute.
 * @class
 * @extends cc.ScaleTo
 */
cc.ScaleBy = cc.ScaleTo.extend(/** @lends cc.ScaleBy# */{
    /**
     * @param {Number} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._deltaX = this._startScaleX * this._endScaleX - this._startScaleX;
        this._deltaY = this._startScaleY * this._endScaleY - this._startScaleY;
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.ScaleBy.create(this._duration, 1 / this._endScaleX, 1 / this._endScaleY);
    }
});
/**
 * @param {Number} duration duration in seconds
 * @param {Number} sx sx  scale parameter in X
 * @param {Number|Null} sy sy scale parameter in Y, if Null equal to sx
 * @return {cc.ScaleBy}
 * @example
 * // example without sy, it scales by 2 both in X and Y
 * var actionBy = cc.ScaleBy.create(2, 2);
 *
 * //example with sy, it scales by 0.25 in X and 4.5 in Y
 * var actionBy2 = cc.ScaleBy.create(2, 0.25, 4.5);
 */
cc.ScaleBy.create = function (duration, sx, sy) {
    var scaleBy = new cc.ScaleBy();
    if (arguments.length == 3) {
        scaleBy.initWithDuration(duration, sx, sy);
    }
    else {
        scaleBy.initWithDuration(duration, sx);
    }

    return scaleBy;
};

/** Blinks a cc.Node object by modifying it's visible attribute
 * @class
 * @extends cc.ActionInterval
 */
cc.Blink = cc.ActionInterval.extend(/** @lends cc.Blink# */{
    /**
     * @param {Number} duration duration in seconds
     * @param {Number} blinks blinks in times
     * @return {Boolean}
     */
    initWithDuration:function (duration, blinks) {
        if (this._super(duration)) {
            this._times = blinks;
            return true;
        }

        return false;
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        if (this._target && !this.isDone()) {
            var slice = 1.0 / this._times;
            var m = time % slice;
            this._target.setIsVisible(m > slice / 2 ? true : false);
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.Blink.create(this._duration, this._times);
    },
    _times:0
});
/**
 * @param {Number} duration  duration in seconds
 * @param blinks blinks in times
 * @return {cc.Blink}
 * @example
 * // example
 * var action = cc.Blink.create(2, 10);
 */
cc.Blink.create = function (duration, blinks) {
    var blink = new cc.Blink();
    blink.initWithDuration(duration, blinks);

    return blink;
};


/** Fades In an object that implements the cc.RGBAProtocol protocol. It modifies the opacity from 0 to 255.<br/>
 * The "reverse" of this action is FadeOut
 * @class
 * @extends cc.ActionInterval
 */
cc.FadeIn = cc.ActionInterval.extend({
    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        this._target.setOpacity(255 * time);
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.FadeOut.create(this._duration);
    }
});

/**
 * @param {Number} duration duration in seconds
 * @return {cc.FadeIn}
 * @example
 * //example
 * var action = cc.FadeIn.create(1.0);
 */
cc.FadeIn.create = function (duration) {
    var action = new cc.FadeIn();

    action.initWithDuration(duration);

    return action;
};


/** Fades Out an object that implements the cc.RGBAProtocol protocol. It modifies the opacity from 255 to 0.
 * The "reverse" of this action is FadeIn
 * @class
 * @extends cc.ActionInterval
 */
cc.FadeOut = cc.ActionInterval.extend(/** @lends cc.FadeOut# */{
    /**
     * @param {Number} time  time in seconds
     */
    update:function (time) {
        this._target.setOpacity(255 * (1 - time));
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.FadeIn.create(this._duration);
    }
});

/**
 * @param {Number} d  duration in seconds
 * @return {cc.FadeOut}
 * @example
 * // example
 * var action = cc.FadeOut.create(1.0);
 */
cc.FadeOut.create = function (d) {
    var action = new cc.FadeOut();

    action.initWithDuration(d);

    return action;
};


/** Fades an object that implements the cc.RGBAProtocol protocol. It modifies the opacity from the current value to a custom one.
 * @warning This action doesn't support "reverse"
 * @class
 * @extends cc.ActionInterval
 */
cc.FadeTo = cc.ActionInterval.extend(/** @lends cc.FadeTo# */{
    /**
     * @param {Number} duration  duration in seconds
     * @param {Number} opacity
     * @return {Boolean}
     */
    initWithDuration:function (duration, opacity) {
        if (this._super(duration)) {
            this._toOpacity = opacity;
            return true;
        }

        return false;
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        this._target.setOpacity((this._fromOpacity + (this._toOpacity - this._fromOpacity) * time));
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._fromOpacity = target.getOpacity();
    },
    _toOpacity:'',
    _fromOpacity:''
});

/**
 * @param {Number} duration
 * @param {Number} opacity 0-255, 0 is transparent
 * @return {cc.FadeTo}
 * @example
 * // example
 * var action = cc.FadeTo.create(1.0, 0);
 */
cc.FadeTo.create = function (duration, opacity) {
    var fadeTo = new cc.FadeTo();
    fadeTo.initWithDuration(duration, opacity);

    return fadeTo;
};


/** Tints a cc.Node that implements the cc.NodeRGB protocol from current tint to a custom one.
 * @warning This action doesn't support "reverse"
 * @class
 * @extends cc.ActionInterval
 */
cc.TintTo = cc.ActionInterval.extend(/** @lends cc.TintTo# */{
    /**
     * @param {Number} duration
     * @param {Number} red 0-255
     * @param {Number} green  0-255
     * @param {Number} blue 0-255
     * @return {Boolean}
     */
    initWithDuration:function (duration, red, green, blue) {
        if (this._super(duration)) {
            this._to = cc.ccc3(red, green, blue);
            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._from = this._target.getColor();
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        this._target.setColor(cc.ccc3(this._from.r + (this._to.r - this._from.r) * time,
            (this._from.g + (this._to.g - this._from.g) * time),
            (this._from.b + (this._to.b - this._from.b) * time)));
    },
    _to:new cc.Color3B(),
    _from:new cc.Color3B()
});

/**
 * @param {Number} duration
 * @param {Number} red 0-255
 * @param {Number} green  0-255
 * @param {Number} blue 0-255
 * @return {cc.TintTo}
 * @example
 * // example
 * var action = cc.TintTo.create(2, 255, 0, 255);
 */
cc.TintTo.create = function (duration, red, green, blue) {
    var tintTo = new cc.TintTo();
    tintTo.initWithDuration(duration, red, green, blue);

    return tintTo;
};


/**  Tints a cc.Node that implements the cc.NodeRGB protocol from current tint to a custom one.
 * @class
 * @extends cc.ActionInterval
 */
cc.TintBy = cc.ActionInterval.extend(/** @lends cc.TintBy# */{
    /**
     * @param {Number} duration
     * @param {Number} deltaRed 0-255
     * @param {Number} deltaGreen 0-255
     * @param {Number} deltaBlue 0-255
     * @return {Boolean}
     */
    initWithDuration:function (duration, deltaRed, deltaGreen, deltaBlue) {
        if (this._super(duration)) {
            this._deltaR = deltaRed;
            this._deltaG = deltaGreen;
            this._deltaB = deltaBlue;

            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        //if (target.RGBAProtocol) {
        var color = target.getColor();
        this._fromR = color.r;
        this._fromG = color.g;
        this._fromB = color.b;
        //}
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        //if (this._target.RGBAProtocol) {
        this._target.setColor(cc.ccc3((this._fromR + this._deltaR * time),
            (this._fromG + this._deltaG * time),
            (this._fromB + this._deltaB * time)));
        //}
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.TintBy.create(this._duration, -this._deltaR, -this._deltaG, -this._deltaB);
    },
    _deltaR:0,
    _deltaG:0,
    _deltaB:0,

    _fromR:0,
    _fromG:0,
    _fromB:0
});

/**
 * @param {Number} duration  duration in seconds
 * @param {Number} deltaRed
 * @param {Number} deltaGreen
 * @param {Number} deltaBlue
 * @return {cc.TintBy}
 * @example
 * // example
 * var action = cc.TintBy.create(2, -127, -255, -127);
 */
cc.TintBy.create = function (duration, deltaRed, deltaGreen, deltaBlue) {
    var tintBy = new cc.TintBy();
    tintBy.initWithDuration(duration, deltaRed, deltaGreen, deltaBlue);

    return tintBy;
};


/** Delays the action a certain amount of seconds
 * @class
 * @extends cc.ActionInterval
 */
cc.DelayTime = cc.ActionInterval.extend(/** @lends cc.DelayTime# */{

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {

    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return cc.DelayTime.create(this._duration);
    }
});

/**
 * @param {Number} d duration in seconds
 * @return {cc.DelayTime}
 * @example
 * // example
 * var delay = cc.DelayTime.create(1);
 */
cc.DelayTime.create = function (d) {
    var action = new cc.DelayTime();

    action.initWithDuration(d);

    return action;
};


/** Executes an action in reverse order, from time=duration to time=0

 * @warning Use this action carefully. This action is not
 * sequenceable. Use it as the default "reversed" method
 * of your own actions, but using it outside the "reversed"
 * scope is not recommended.
 * @class
 * @extends cc.ActionInterval
 */
cc.ReverseTime = cc.ActionInterval.extend(/** @lends cc.ReverseTime# */{
    /**
     * @param {cc.FiniteTimeAction} action
     * @return {Boolean}
     */
    initWithAction:function (action) {
        cc.Assert(action != null, "");
        cc.Assert(action != this._other, "");

        if (this._super(action.getDuration())) {
            // Don't leak if action is reused

            this._other = action;

            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);
        this._other.startWithTarget(target);
    },

    /**
     * @param {Number} time time in seconds
     */
    update:function (time) {
        if (this._other) {
            this._other.update(1 - time);
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        return this._other.copy();
    },

    /**
     * Stop the action
     */
    stop:function () {
        this._other.stop();
        this._super();
    },
    _other:null
});

/**
 * @param {cc.FiniteTimeAction} action
 * @return {cc.ReverseTime}
 * @example
 * // example
 *  var reverse = cc.ReverseTime.create(this);
 */
cc.ReverseTime.create = function (action) {
    var reverseTime = new cc.ReverseTime();
    reverseTime.initWithAction(action);

    return reverseTime;
};


/**  Animates a sprite given the name of an Animation
 * @class
 * @extends cc.ActionInterval
 */
cc.Animate = cc.ActionInterval.extend(/** @lends cc.Animate# */{
    _animation:null,
    _origFrame:null,
    _restoreOriginalFrame:false,

    /**
     * @return {cc.Animation}
     */
    getAnimation:function () {
        return this._animation;
    },

    /**
     * @param {cc.Animation} animation
     */
    setAnimation:function (animation) {
        this._animation = animation;
    },

    /**
     * @param {cc.Animation} animation
     * @param {Boolean} restoreOriginalFrame
     * @return {Boolean}
     */
    initWithAnimation:function (animation, restoreOriginalFrame) {
        cc.Assert(animation != null, "");
        if (this.initWithDuration(animation.getFrames().length * animation.getDelay(), null, null, true)) {
            this._restoreOriginalFrame = restoreOriginalFrame;
            this._animation = animation;
            this._origFrame = null;
            return true;
        }

        return false;
    },

    /**
     * @param {Number} duration
     * @param {cc.Animation} animation
     * @param {Boolean} restoreOriginalFrame
     * @param {Boolean} isSuperCall
     * @return {*}
     */
    initWithDuration:function (duration, animation, restoreOriginalFrame, isSuperCall) {
        if (isSuperCall) {
            return this._super(duration);
        }
        cc.Assert(animation != null, "");

        if (this._super(duration)) {
            this._restoreOriginalFrame = restoreOriginalFrame;
            this._animation = animation;
            this._origFrame = null;

            return true;
        }

        return false;
    },

    /**
     * @param {cc.Node} target
     */
    startWithTarget:function (target) {
        this._super(target);

        if (this._restoreOriginalFrame) {
            this._origFrame = target.displayedFrame();
        }
    },

    /**
     * @param {Number} time
     */
    update:function (time) {
        var frames = this._animation.getFrames();
        var numberOfFrames = frames.length;

        var idx = 0 | (time * numberOfFrames);

        if (idx >= numberOfFrames) {
            idx = numberOfFrames - 1;
        }

        var sprite = this._target;
        if (!sprite.isFrameDisplayed(frames[idx])) {
            sprite.setDisplayFrame(frames[idx]);
        }
    },

    /**
     * @return {cc.ActionInterval}
     */
    reverse:function () {
        var newAnim = cc.Animation.create(this._animation.getFrames().reverse(), this._animation.getDelay());
        return cc.Animate.create(this._duration, newAnim, this._restoreOriginalFrame);
    },

    /**
     * stop the action
     */
    stop:function () {
        if (this._restoreOriginalFrame && this._target) {
            this._target.setDisplayFrame(this._origFrame);
        }

        this._super();
    }
});

/**
 * It accepts three groups of parameters:
 * a) animation
 * b) animation, restoreOriginalFrame
 * c) duration, animation, restoreOriginalFrame
 * @return {cc.Animate}
 * @example
 * // example
 * // create the animation with animation
 * var anim = cc.Animate.create(dance_grey);
 *
 * // create the animation with animation and restoreOriginalFrame
 * var anim = cc.Animate.create(dance_grey, false);
 *
 * // create the animation with duration, animation and restoreOriginalFrame
 * var anim = cc.Animate.create(10, dance_grey, false);  // duration in seconds
 */
cc.Animate.create = function (/* Multi arguments */) {
    var animate = new cc.Animate();
    if (arguments.length == 3) {
        animate.initWithDuration(arguments[0], arguments[1], arguments[2]);
    } else {
        animate.initWithAnimation(arguments[0], arguments[1]);
    }

    return animate;
};