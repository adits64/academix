import { NotFoundError } from "../errors/not-found.js";
import { ValidationError } from "../errors/validation.js";
import User from "../models/user.js";
import { compare } from "bcrypt";

export const create = async(data) =>{
    const user = await User.create(data);
    const {password, ...UserWithoutPassword}  = user.toObject();
    return UserWithoutPassword;
};

export const getAll = async () => {
    const users = await User.find({}, {password: 0});
    return users;
}

// export const getUserById = async(_id) => {
//     const user = await User.findById(_id, {password:0});
//     if(!user) throw new NotFoundError("User not found");
//     return user;
// }

export const find = async(param, config) => {
    const user = await User.findOne( param, config);
    if(!user) throw new NotFoundError('User Not Found');
    return user;

};

export const update = async (id , data, isAdmin = false, isSelf = false) => {
    let { role, currentPassword, ...dataToUpdate } = data;

    // Check if password change is requested
    if (dataToUpdate.password) {
        const requiresCurrentPassword = isSelf || !isAdmin;
        if (requiresCurrentPassword) {
            if (!currentPassword) {
                throw new ValidationError("Current password is required to change password");
            }
            const existingUser = await User.findById(id);
            if (!existingUser) throw new NotFoundError("User not found");

            const match = await compare(currentPassword, existingUser.password);
            if (!match) {
                throw new ValidationError("Current password is incorrect");
            }
        }
    }

    if (isAdmin && role) {
        dataToUpdate.role = role;
    }

    const user = await User.findByIdAndUpdate(
        id,
        dataToUpdate,
        {
            returnDocument : 'after',
            projection : {
                password:0
            }
        }
    );
    if(!user) throw new NotFoundError('User not found');
    return user;
}

export const destroy = async (id)=>{
    const user = await User.findByIdAndDelete(id ,{
        projection:{
            password:0
        }
    });
    if(!user) throw new NotFoundError('User not found');
    return user;
}