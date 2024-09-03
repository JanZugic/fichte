using System;
using System.Collections.Generic;

namespace RealTimeChat.Models;

public partial class Room
{
    public int RoomId { get; set; }

    public string RoomName { get; set; } = null!;

    public int CreatorId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User Creator { get; set; } = null!;

    public virtual ICollection<Message> Messages { get; set; } = new List<Message>();

    public virtual ICollection<RoomMember> RoomMembers { get; set; } = new List<RoomMember>();
}
