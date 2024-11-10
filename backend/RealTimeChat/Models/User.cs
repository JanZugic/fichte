using System;
using System.Collections.Generic;

namespace RealTimeChat.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string Name { get; set; } = null!;

    public string Surname { get; set; } = null!;

    public string Email { get; set; } = null!;

    public bool? IsEmailConfirmed { get; set; }

    public string? ProfilePicture { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<RoomMember> RoomMembers { get; set; } = new List<RoomMember>();

    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();
}
